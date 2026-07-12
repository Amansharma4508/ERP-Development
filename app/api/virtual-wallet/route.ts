import { NextRequest } from 'next/server';
import {
  virtualWalletUsers, offlineTransactions, onlineTransactions,
  mainLedgerEntries, creditNotes, familyMembers,
} from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

function guard(token: string | undefined) {
  if (!token) return null;
  const p = verifyToken(token);
  if (!p || (p.role !== 'wallet_user' && p.role !== 'admin')) return null;
  return p;
}

// GET /api/virtual-wallet — full overview for the logged-in wallet_user
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  const payload = guard(token);
  if (!payload) return toJson(errorResponse('Unauthorized', 401));

  const userId = payload.userId;
  const vwUser = virtualWalletUsers.find((u) => u.id === userId);
  if (!vwUser) return toJson(errorResponse('Virtual wallet account not found', 404));

  const showMasterDetails = payload.role === 'admin';
  const responseUser = showMasterDetails
    ? vwUser
    : (({ masterLedgerBalance, ...rest }) => rest)(vwUser as any);

  // ── Raw data ──────────────────────────────────────────────────────────────
  const offline = offlineTransactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const online = onlineTransactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const ledger = mainLedgerEntries
    .filter((e) => e.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const notes = creditNotes
    .filter((c) => c.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const members = familyMembers.filter((f) => f.primaryUserId === userId);

  // ── Aggregate spend — EXCLUDE reversed/refunded/failed/pending ────────────
  // Offline: only 'posted' count as real spend
  const totalOfflineSpent = offline
    .filter((t) => t.status === 'posted')
    .reduce((s, t) => s + t.amount, 0);

  // Online: only 'success' count as real spend; 'refunded' is a return, not new spend
  const totalOnlineSpent = online
    .filter((t) => t.status === 'success')
    .reduce((s, t) => s + t.amount, 0);

  const totalSpent = totalOfflineSpent + totalOnlineSpent;

  // ── Center-wise breakdown — EXCLUDE reversed ──────────────────────────────
  const centers = ['S1', 'S2', 'S3', 'DHS'] as const;
  const centerBreakdown = centers.map((c) => {
    const allTxns  = offline.filter((t) => t.center === c);
    const validTxns= allTxns.filter((t) => t.status === 'posted');
    return {
      center:      c,
      centerName:  allTxns[0]?.centerName ?? `${c} Center`,
      txnCount:    validTxns.length,            // only posted
      totalSpent:  validTxns.reduce((s, t) => s + t.amount, 0),
      transactions: allTxns,                    // full list for display
    };
  });

  // ── Credit notes ──────────────────────────────────────────────────────────
  // totalCreditNotes = sum of NON-master notes only (transaction-level acknowledgements)
  // Master Credit Note represents the initial capital allocation — it should NOT be
  // added to spend-side totals, so we separate it.
  const nonMasterCreditNoteTotal = notes
    .filter((n) => !n.isMaster)
    .reduce((s, n) => s + n.amount, 0);

  const masterCreditNoteAmount = notes
    .filter((n) => n.isMaster)
    .reduce((s, n) => s + n.amount, 0);

  const totalCreditNotesValue = notes.reduce((s, n) => s + n.amount, 0);

  // ── Audit check: non-master credit notes should not exceed allocation ─────
  const creditNoteAuditWarning =
    nonMasterCreditNoteTotal > vwUser.allocatedAmount
      ? `⚠ Non-master credit note total (₹${nonMasterCreditNoteTotal.toLocaleString()}) exceeds wallet allocation (₹${vwUser.allocatedAmount.toLocaleString()}). Manual review required.`
      : null;

  // ── Ledger totals — ONLY 'posted' entries, derive from real transaction data
  const ledgerDebits = ledger
    .filter((e) => e.entryType === 'debit' && e.status === 'posted')
    .reduce((s, e) => s + e.amount, 0);

  const ledgerCredits = ledger
    .filter((e) => e.entryType === 'credit' && e.status === 'posted')
    .reduce((s, e) => s + e.amount, 0);

  const netLedger = ledgerCredits - ledgerDebits;

  const lowBalanceThreshold = Math.round(vwUser.allocatedAmount * 0.2);
  const remainingBalance    = netLedger;
  const isLowBalance        = remainingBalance <= lowBalanceThreshold;

  const breadcrumb = showMasterDetails
    ? [
        { label: 'Master Wallet', value: `₹${vwUser.masterLedgerBalance.toLocaleString()}` },
        { label: 'State Wallet', value: `₹${vwUser.stateWalletBalance.toLocaleString()}` },
        { label: `Center ${vwUser.centerAssigned}`, value: `₹${totalOfflineSpent.toLocaleString()} spent` },
        { label: 'User Wallet', value: `₹${remainingBalance.toLocaleString()} remaining` },
      ]
    : [
        { label: 'State Wallet', value: `₹${vwUser.stateWalletBalance.toLocaleString()}` },
        { label: `Center ${vwUser.centerAssigned}`, value: `₹${totalOfflineSpent.toLocaleString()} spent` },
        { label: 'User Wallet', value: `₹${remainingBalance.toLocaleString()} remaining` },
      ];

  return toJson(
    successResponse({
      user: responseUser,
      summary: {
        allocatedAmount:          vwUser.allocatedAmount,
        stateWalletBalance:       vwUser.stateWalletBalance,
        offlineBalance:           vwUser.offlineBalance,
        onlineBalance:            vwUser.onlineBalance,
        totalSpent,
        totalOfflineSpent,
        totalOnlineSpent,
        // totalCreditNotes = non-master only, so it never exceeds ₹35,000
        totalCreditNotes:         nonMasterCreditNoteTotal,
        totalCreditNotesValue,
        masterCreditNoteAmount,
        remainingBalance,
        ledgerDebits,
        ledgerCredits,
        netLedger,
        lowBalanceThreshold,
        isLowBalance,
        creditNoteAuditWarning,
      },
      centerBreakdown,
      offline,
      online,
      ledger,
      creditNotes: notes,
      familyMembers: members,
      // breadcrumb hierarchy
      breadcrumb,
    }),
  );
}
