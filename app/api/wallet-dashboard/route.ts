import { NextRequest } from 'next/server';
import {
  wallets, walletTransactions,
  doctorWallets, doctorWalletTransactions,
  logisticsWallet, logisticsLedger,
  paymentControls, walletActivityLog,
  users, doctors,
} from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

function adminGuard(token: string | undefined) {
  if (!token) return null;
  const p = verifyToken(token);
  if (!p || (p.role !== 'admin' && p.role !== 'logistics')) return null;
  return p;
}

// GET /api/wallet-dashboard
// Returns complete wallet overview: all user wallets, doctor wallets,
// logistics wallet, payment controls, and recent activity log.
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  const payload = adminGuard(token);
  if (!payload) return toJson(errorResponse('Unauthorized — admin access required', 401));

  // ── User wallets ──────────────────────────────────────────────────────────
  const userWallets = wallets.map((w) => {
    const user = users.find((u) => u.id === w.userId);
    const txns = walletTransactions.filter((t) => t.userId === w.userId);
    const totalCredit = txns.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalDebit  = txns.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    const control = paymentControls.find(
      (c) => c.entityType === 'user' && c.entityId === w.userId,
    );
    return {
      userId:      w.userId,
      fullName:    user?.fullName ?? 'Unknown User',
      email:       user?.email   ?? '',
      role:        user?.role    ?? 'user',
      balance:     w.balance,
      totalCredit,
      totalDebit,
      txnCount:    txns.length,
      recentTxns:  txns
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
      paymentPaused:  control?.paused      ?? false,
      pauseReason:    control?.pauseReason ?? null,
      controlId:      control?.id          ?? null,
    };
  });

  // ── Doctor wallets ────────────────────────────────────────────────────────
  const docWallets = doctorWallets.map((dw) => {
    const txns = doctorWalletTransactions.filter((t) => t.doctorId === dw.doctorId);
    const control = paymentControls.find(
      (c) => c.entityType === 'doctor' && c.entityId === dw.doctorId,
    );
    return {
      ...dw,
      txnCount:     txns.length,
      recentTxns:   txns.slice(-5).reverse(),
      paymentPaused:  control?.paused      ?? false,
      pauseReason:    control?.pauseReason ?? null,
      controlId:      control?.id          ?? null,
    };
  });

  // ── Logistics wallet ──────────────────────────────────────────────────────
  const logisticsControl = paymentControls.find(
    (c) => c.entityType === 'logistics' && c.entityId === 'logistics-global',
  );
  const recentLedger = [...logisticsLedger]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const logisticsData = {
    ...logisticsWallet,
    recentLedger,
    paymentPaused:  logisticsControl?.paused      ?? false,
    pauseReason:    logisticsControl?.pauseReason ?? null,
    controlId:      logisticsControl?.id          ?? null,
  };

  // ── System-level control ──────────────────────────────────────────────────
  const systemControl = paymentControls.find(
    (c) => c.entityType === 'system' && c.entityId === 'system-global',
  );

  // ── Aggregate summary ─────────────────────────────────────────────────────
  const totalUserBalance   = wallets.reduce((s, w) => s + w.balance, 0);
  const totalDoctorBalance = doctorWallets.reduce((s, d) => s + d.balance, 0);
  const totalSystemFunds   = totalUserBalance + totalDoctorBalance + logisticsWallet.balance;
  const activePauses       = paymentControls.filter((c) => c.paused).length;

  // ── Recent activity ───────────────────────────────────────────────────────
  const recentActivity = [...walletActivityLog]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return toJson(
    successResponse({
      summary: {
        totalUserBalance,
        totalDoctorBalance,
        logisticsBalance: logisticsWallet.balance,
        totalSystemFunds,
        activePauses,
        totalWallets: wallets.length + doctorWallets.length + 1,
      },
      userWallets,
      doctorWallets: docWallets,
      logistics: logisticsData,
      systemControl: {
        paused:       systemControl?.paused      ?? false,
        pauseReason:  systemControl?.pauseReason ?? null,
        controlId:    systemControl?.id          ?? null,
      },
      recentActivity,
      paymentControls,
    }),
  );
}
