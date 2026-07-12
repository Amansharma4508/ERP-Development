'use client';

import { useAuth } from '@/lib/auth-context';
import { useCallback, useEffect, useState } from 'react';
import { CreditCard, WifiOff, Wifi, ArrowDown, Building2, ChevronRight, Wallet, Database } from 'lucide-react';

export default function AllocationPage() {
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

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_,i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>;
  if (!data) return null;

  const { user, summary, centerBreakdown, breadcrumb } = data;

  // Correct hierarchy: Master Wallet → State Wallet Account → Center Wallet → User Wallet
  const hierarchy = [
    {
      label: 'Master Wallet',
      sublabel: 'Total capital registered',
      value: `₹${user.masterLedgerBalance.toLocaleString()}`,
      desc: 'Government master ledger — total fund pool across all state wallets',
      color: 'border-indigo-300 bg-indigo-50 text-indigo-700',
      Icon: Database,
    },
    {
      label: 'State Wallet Account',
      sublabel: 'Allocated to this state',
      value: `₹${user.stateWalletBalance.toLocaleString()}`,
      desc: 'Funds drawn from master wallet and held at the state level',
      color: 'border-teal-300 bg-teal-50 text-teal-700',
      Icon: Wallet,
    },
    {
      label: `Center Wallet (${user.centerAssigned})`,
      sublabel: 'Center-level disbursement',
      value: `₹${summary.totalOfflineSpent.toLocaleString()} spent`,
      desc: 'Debit mode — funds flow to assigned health center for offline services',
      color: 'border-amber-300 bg-amber-50 text-amber-700',
      Icon: Building2,
    },
    {
      label: 'User Wallet (Card)',
      sublabel: 'Distributed to physical card',
      value: `₹${summary.remainingBalance.toLocaleString()} remaining`,
      desc: 'Physical SWAB card loaded with ₹35,000 for both offline and online spend',
      color: 'border-violet-300 bg-violet-50 text-violet-700',
      Icon: CreditCard,
    },
  ];

  const offlinePct = summary.allocatedAmount > 0 ? (user.offlineBalance / summary.allocatedAmount) * 100 : 0;
  const onlinePct  = summary.allocatedAmount > 0 ? (user.onlineBalance  / summary.allocatedAmount) * 100 : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fund Allocation</h1>
        <p className="text-muted-foreground text-sm mt-1">How your ₹35,000 state fund flows from master ledger to your card</p>
      </div>

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 flex-wrap text-xs text-muted-foreground bg-muted px-4 py-2.5 rounded-xl">
        {breadcrumb.map((b: any, i: number) => (
          <span key={b.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-border" />}
            <span className="font-semibold text-foreground">{b.label}</span>
            <span className="text-muted-foreground">({b.value})</span>
          </span>
        ))}
      </div>

      {/* ── Correct top-down hierarchy flow ──────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <p className="text-sm font-semibold text-foreground mb-2">Debit Mode — Fund Dilocation Flow</p>
        <p className="text-xs text-muted-foreground mb-6">Money flows top-down: Master → State → Center → User</p>
        <div className="flex flex-col gap-1">
          {hierarchy.map(({ label, sublabel, value, desc, color, Icon }, i) => (
            <div key={label}>
              <div className={`rounded-2xl border-2 p-4 ${color}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-tight">{label}</p>
                      <p className="text-xs opacity-70 mt-0.5">{sublabel}</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold shrink-0">{value}</p>
                </div>
                <p className="text-xs opacity-60 mt-2 ml-13">{desc}</p>
              </div>
              {i < hierarchy.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown size={18} className="text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Offline / Online split ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <WifiOff size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Offline Mode</p>
              <p className="text-xs text-muted-foreground">Center S1 / S2 / S3 / DHS</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">₹{user.offlineBalance.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mb-3">Allocated for offline center visits</p>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-1">
            <div className="h-2 rounded-full bg-linear-to-r from-amber-400 to-orange-500" style={{ width: `${offlinePct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{offlinePct.toFixed(0)}% of total allocation</p>
          <p className="text-xs text-muted-foreground mt-2">
            Spent (posted only): <span className="font-semibold text-foreground">₹{summary.totalOfflineSpent.toLocaleString()}</span>
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Wifi size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Online Mode</p>
              <p className="text-xs text-muted-foreground">Teleconsult App / E-Medical</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">₹{user.onlineBalance.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mb-3">Allocated for online services</p>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-1">
            <div className="h-2 rounded-full bg-linear-to-r from-violet-400 to-indigo-500" style={{ width: `${onlinePct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{onlinePct.toFixed(0)}% of total allocation</p>
          <p className="text-xs text-muted-foreground mt-2">
            Spent (success only): <span className="font-semibold text-foreground">₹{summary.totalOnlineSpent.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* ── Overall spend summary ────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Overall Spend Summary</p>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: 'Allocated', value: `₹${summary.allocatedAmount.toLocaleString()}`, color: 'text-teal-600'    },
            { label: 'Spent',     value: `₹${summary.totalSpent.toLocaleString()}`,       color: 'text-red-500'    },
            { label: 'Remaining', value: `₹${summary.remainingBalance.toLocaleString()}`, color: 'text-emerald-600'},
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-3 rounded-xl bg-muted">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="w-full h-4 rounded-full overflow-hidden bg-muted flex">
          <div className="h-full bg-amber-400" style={{ width: `${(summary.totalOfflineSpent/summary.allocatedAmount)*100}%` }} title="Offline" />
          <div className="h-full bg-violet-400" style={{ width: `${(summary.totalOnlineSpent/summary.allocatedAmount)*100}%` }} title="Online" />
        </div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Offline (posted)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-violet-400 inline-block" /> Online (success)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-muted border border-border inline-block" /> Remaining</span>
        </div>
      </div>

      {/* ── Center-wise breakdown ────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building2 size={15} className="text-amber-500" /> Center-wise Offline Distribution (posted only)
        </p>
        <div className="space-y-3">
          {centerBreakdown.filter((c: any) => c.txnCount > 0).map((c: any) => {
            const pct = summary.totalOfflineSpent > 0 ? (c.totalSpent / summary.totalOfflineSpent) * 100 : 0;
            return (
              <div key={c.center}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{c.center} — {c.centerName}</span>
                  <span className="text-sm font-bold text-foreground">₹{c.totalSpent.toLocaleString()}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-linear-to-r from-amber-400 to-orange-400" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{c.txnCount} transactions · {pct.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
