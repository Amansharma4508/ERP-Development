'use client';

import { useAuth } from '@/lib/auth-context';
import { useCallback, useEffect, useState } from 'react';
import {
  FileText, CheckCircle2, BookOpen, ArrowRight, TrendingUp, TrendingDown,
  Building2, Database, Shield, Download, AlertTriangle, AlertCircle, ChevronRight,
} from 'lucide-react';

function exportCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]).filter(k => !Array.isArray(rows[0][k]) && typeof rows[0][k] !== 'object');
  const csv  = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

export default function SummaryPage() {
  const { token } = useAuth();
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) return;
    const res  = await fetch('/api/virtual-wallet', { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_,i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>;
  if (!data) return null;

  const { user, summary, offline, online, ledger, creditNotes, centerBreakdown, breadcrumb } = data;
  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });

  // All three figures from same source: summary object from API
  const masterCN = creditNotes.find((cn: any) => cn.isMaster);
  const nonMasterTotal = summary.totalCreditNotes;           // API: sum of non-master notes only
  const masterTotal = summary.masterCreditNoteAmount;        // API: MCN amount
  const totalCreditNotesValue = summary.totalCreditNotesValue; // API: sum of all credit notes records
  const ledgerCreditTotal = summary.ledgerCredits;           // API: sum of posted credit ledger entries

  // Validate: non-master total should not exceed allocation
  const auditOk = nonMasterTotal <= summary.allocatedAmount;

  const pipelineSteps = [
    { label: 'User Enrollment',               value: user.enrollmentDate,                   done: true  },
    { label: 'Data Center Process',            value: 'Completed',                           done: true  },
    { label: 'Print Card & Dispatch',          value: user.dispatchDate ?? 'Pending',        done: !!user.dispatchDate  },
    { label: 'Scan / Review at Center',        value: user.cardScanStatus,                   done: user.cardScanStatus === 'verified' },
    { label: 'Wallet Activated ₹35,000',       value: user.activationDate ?? 'Pending',      done: user.enrollmentStatus === 'active' },
    { label: 'Center Wallet Active',           value: `₹${summary.totalOfflineSpent.toLocaleString()} spent`, done: summary.totalOfflineSpent > 0 },
    { label: 'State Wallet Account',           value: `₹${summary.allocatedAmount.toLocaleString()} allocated`, done: true },
    { label: 'Offline Debit Mode',             value: `${offline.filter((t:any)=>t.status==='posted').length} posted txns`, done: summary.totalOfflineSpent > 0 },
    { label: 'Online Payment Gateway',         value: `${online.filter((t:any)=>t.status==='success').length} success txns`, done: summary.totalOnlineSpent > 0 },
    { label: 'Main Ledger Entry System',       value: `${ledger.length} entries`,            done: ledger.length > 0  },
    { label: 'Credit Notes Issued',            value: `${creditNotes.length} notes`,         done: creditNotes.length > 0 },
    { label: 'Final Transaction Summary',      value: today,                                 done: true  },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header + Export */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText size={22} className="text-teal-500" /> Final Transaction Summary
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Complete audit trail — all flows from enrollment to settlement</p>
        </div>
        <button onClick={() => exportCSV(ledger, 'final-summary-ledger.csv')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition">
          <Download size={14} /> Export Ledger CSV
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-wrap text-xs text-muted-foreground bg-muted px-4 py-2.5 rounded-xl">
        {breadcrumb.map((b: any, i: number) => (
          <span key={b.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-border" />}
            <span className="font-semibold text-foreground">{b.label}</span>
            <span>({b.value})</span>
          </span>
        ))}
      </div>

      {/* Audit check banner */}
      {!auditOk ? (
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-50 border border-red-300 text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <div>
            <p className="font-bold">Audit Warning</p>
            <p className="text-xs mt-0.5">{summary.creditNoteAuditWarning}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle2 size={18} className="shrink-0" />
          <p className="text-xs font-medium">Audit OK — Non-master credit note total (₹{nonMasterTotal.toLocaleString()}) is within wallet allocation (₹{summary.allocatedAmount.toLocaleString()}).</p>
        </div>
      )}

      {/* Account header */}
      <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-5 flex-wrap">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0"
          style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
          {user.fullName.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground">{user.fullName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Card: {user.cardNumber} · Center: {user.centerAssigned}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Enrolled: {user.enrollmentDate}{user.activationDate ? ` · Activated: ${user.activationDate}` : ''}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200">
          <Shield size={14} className="text-teal-600" />
          <span className="text-xs font-semibold text-teal-700">{user.enrollmentStatus.replace('_',' ').toUpperCase()}</span>
        </div>
      </div>

      {/* Financial summary — all from same API source */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Financial Summary</h3>
          <span className="text-xs text-muted-foreground">All figures from single API source</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
          {[
            { label: 'Total Credit Notes Value',   value: `₹${totalCreditNotesValue.toLocaleString()}`,   color: 'text-blue-600',  sub: 'Master + transaction notes' },
            { label: 'Master Credit Note Total',   value: `₹${masterTotal.toLocaleString()}`,             color: 'text-indigo-600', sub: 'Initial capital allocation' },
            { label: 'Non-Master Credit Notes',    value: `₹${nonMasterTotal.toLocaleString()}`,           color: 'text-teal-600',  sub: 'Transaction level credits' },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="rounded-2xl bg-muted p-4 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-2">{sub}</p>
            </div>
          ))}
        </div>
        <div className="divide-y divide-border">
          {[
            { label: 'Total State Allocation',    value: `₹${summary.allocatedAmount.toLocaleString()}`,      isCredit: true,  bold: true  },
            { label: 'Offline Expenses (posted)',  value: `-₹${summary.totalOfflineSpent.toLocaleString()}`,   isCredit: false, bold: false },
            { label: 'Online Expenses (success)',  value: `-₹${summary.totalOnlineSpent.toLocaleString()}`,    isCredit: false, bold: false },
            { label: 'Total Spent',                value: `-₹${summary.totalSpent.toLocaleString()}`,          isCredit: false, bold: true  },
            { label: 'Net Ledger Position',        value: `₹${Math.abs(summary.netLedger).toLocaleString()}`,  isCredit: summary.netLedger >= 0, bold: true },
            { label: 'Remaining Balance',          value: `₹${summary.remainingBalance.toLocaleString()}`,     isCredit: true,  bold: true  },
          ].map(({ label, value, isCredit, bold }) => (
            <div key={label} className={`flex items-center justify-between px-5 py-3 ${bold ? 'bg-muted/30' : ''}`}>
              <p className={`text-sm ${bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{label}</p>
              <p className={`text-sm font-bold ${bold ? 'text-base' : ''} ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Center breakdown */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building2 size={15} className="text-amber-500" /> Center-wise Breakdown (posted only)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {centerBreakdown.map((c: any) => (
            <div key={c.center} className="rounded-xl bg-muted border border-border p-3 text-center">
              <p className="text-xs font-bold text-foreground">{c.center}</p>
              <p className="text-lg font-bold text-amber-600 mt-1">₹{c.totalSpent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{c.txnCount} txns</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ledger reconciliation — all three figures from same source */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen size={15} className="text-blue-500" /> Ledger Reconciliation
          <span className="text-xs font-normal text-muted-foreground ml-1">(all from API summary)</span>
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-2 mb-1"><TrendingDown size={14} className="text-red-500" /><p className="text-xs text-red-600">Total Ledger Debits</p></div>
            <p className="text-xl font-bold text-red-600">₹{summary.ledgerDebits.toLocaleString()}</p>
            <p className="text-xs text-red-400 mt-1">{ledger.filter((e:any)=>e.entryType==='debit').length} entries</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
            <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-emerald-500" /><p className="text-xs text-emerald-600">Total Ledger Credits</p></div>
            <p className="text-xl font-bold text-emerald-600">₹{summary.ledgerCredits.toLocaleString()}</p>
            <p className="text-xs text-emerald-400 mt-1">{ledger.filter((e:any)=>e.entryType==='credit').length} entries</p>
          </div>
        </div>
        {/* Master Credit Note separately — clearly labelled as capital, not spend */}
        <div className="rounded-xl bg-muted border border-border p-4 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-indigo-500" />
            <div>
              <p className="text-sm font-semibold text-foreground">Master Credit Note (capital allocation)</p>
              <p className="text-xs text-muted-foreground">Ref: {masterCN?.noteRef} — NOT included in spend totals</p>
            </div>
          </div>
          <p className="text-sm font-bold text-indigo-600">₹{masterTotal.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-teal-500" />
            <div>
              <p className="text-sm font-semibold text-foreground">Non-Master Credit Note Total</p>
              <p className="text-xs text-muted-foreground">Transaction-level acknowledgements only</p>
            </div>
          </div>
          <p className="text-sm font-bold text-teal-600">₹{nonMasterTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Full flow pipeline */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
          <ArrowRight size={15} className="text-teal-500" /> Complete Flow Pipeline
        </h3>
        <div className="space-y-0">
          {pipelineSteps.map((step, i) => (
            <div key={step.label} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2
                  ${step.done ? 'bg-teal-500 border-teal-500 text-white' : 'bg-muted border-border text-muted-foreground'}`}>
                  {step.done ? <CheckCircle2 size={14} /> : <span className="text-xs font-bold">{i+1}</span>}
                </div>
                {i < pipelineSteps.length - 1 && (
                  <div className={`w-0.5 h-8 my-0.5 ${step.done ? 'bg-teal-400' : 'bg-border'}`} />
                )}
              </div>
              <div className={`pb-5 ${i === pipelineSteps.length - 1 ? 'pb-0' : ''} flex items-start justify-between w-full`}>
                <p className={`text-sm font-medium mt-1 ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                <span className={`text-xs font-semibold mt-1 ml-2 shrink-0 ${step.done ? 'text-emerald-600' : 'text-amber-600'}`}>{step.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
