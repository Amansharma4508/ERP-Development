'use client';

import { useAuth } from '@/lib/auth-context';
import { useCallback, useEffect, useState } from 'react';
import { Building2, WifiOff, CheckCircle2, Clock, RotateCcw } from 'lucide-react';

const CENTER_COLOR: Record<string, { bg: string; badge: string }> = {
  S1:  { bg: 'from-teal-500 to-cyan-600',     badge: 'bg-teal-100 text-teal-700'     },
  S2:  { bg: 'from-amber-500 to-orange-600',  badge: 'bg-amber-100 text-amber-700'   },
  S3:  { bg: 'from-violet-500 to-purple-600', badge: 'bg-violet-100 text-violet-700' },
  DHS: { bg: 'from-blue-500 to-indigo-600',   badge: 'bg-blue-100 text-blue-700'     },
};

const SERVICE_COLOR: Record<string, string> = {
  OPD: 'bg-teal-50 text-teal-700 border-teal-200',
  IPD: 'bg-violet-50 text-violet-700 border-violet-200',
  Lab: 'bg-blue-50 text-blue-700 border-blue-200',
  Pharmacy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Diagnostics: 'bg-amber-50 text-amber-700 border-amber-200',
  Other: 'bg-muted text-muted-foreground border-border',
};

export default function CenterWalletPage() {
  const { token } = useAuth();
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [activeCenter, setActiveCenter] = useState<string>('ALL');

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

  const { centerBreakdown, offline, summary } = data;
  // For transaction list: show all (including reversed — they display with badge)
  const filteredTxns: any[] = activeCenter === 'ALL' ? offline : offline.filter((t: any) => t.center === activeCenter);
  // For expense mode distribution: ONLY posted transactions
  const postedOffline: any[] = offline.filter((t: any) => t.status === 'posted');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Center Wallet</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Offline expense modes — S1 / S2 / S3 / DHS centers
          <span className="ml-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-lg">
            Totals exclude reversed transactions
          </span>
        </p>
      </div>

      {/* ── Center summary cards (posted totals only) ─────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {centerBreakdown.map((c: any) => {
          const colors = CENTER_COLOR[c.center] ?? { bg: 'from-gray-400 to-gray-500', badge: 'bg-muted text-muted-foreground' };
          return (
            <button key={c.center} onClick={() => setActiveCenter(c.center === activeCenter ? 'ALL' : c.center)}
              className={`bg-gradient-to-br ${colors.bg} rounded-2xl p-5 text-white shadow-lg transition-all relative overflow-hidden
                ${activeCenter === c.center ? 'ring-4 ring-white/50 scale-[1.02]' : 'hover:scale-[1.01]'}`}>
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-lg">{c.center}</span>
                  <Building2 size={16} className="text-white/60" />
                </div>
                {/* totalSpent from API already excludes reversed */}
                <p className="text-2xl font-bold">₹{c.totalSpent.toLocaleString()}</p>
                <p className="text-white/70 text-xs mt-1">{c.txnCount} posted txns</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Expense mode distribution — POSTED only ───────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="text-sm font-semibold text-foreground mb-1">Expense Mode Distribution</p>
        <p className="text-xs text-muted-foreground mb-4">Posted transactions only — reversed transactions excluded from totals</p>
        <div className="space-y-2">
          {(['OPD','Lab','Pharmacy','Diagnostics','IPD','Other'] as const).map((svc) => {
            const txns  = postedOffline.filter((t: any) => t.serviceType === svc);
            const total = txns.reduce((s: number, t: any) => s + t.amount, 0);
            if (total === 0) return null;
            const pct = summary.totalOfflineSpent > 0 ? (total / summary.totalOfflineSpent) * 100 : 0;
            return (
              <div key={svc}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${SERVICE_COLOR[svc]}`}>{svc}</span>
                    <span className="text-xs text-muted-foreground">{txns.length} txns</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">₹{total.toLocaleString()}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{pct.toFixed(1)}% of offline spend</p>
              </div>
            );
          })}
        </div>
        {/* Verify total matches summary */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Distribution total</span>
          <span className="font-bold text-foreground">₹{summary.totalOfflineSpent.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Transaction list (all statuses visible, reversed clearly marked) */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-foreground">Offline Transactions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{filteredTxns.length} records (reversed shown with badge, excluded from totals)</p>
          </div>
          <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto">
            {['ALL','S1','S2','S3','DHS'].map((c) => (
              <button key={c} onClick={() => setActiveCenter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex-shrink-0
                  ${activeCenter === c ? 'bg-white shadow text-foreground' : 'text-muted-foreground'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-border">
          {filteredTxns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <WifiOff size={36} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No transactions for this center</p>
            </div>
          ) : filteredTxns.map((t: any) => {
            const colors   = CENTER_COLOR[t.center] ?? CENTER_COLOR.S1;
            const svcColor = SERVICE_COLOR[t.serviceType] ?? SERVICE_COLOR.Other;
            const statusIcon = t.status === 'posted'  ? <CheckCircle2 size={13} className="text-emerald-500" />
              : t.status === 'pending' ? <Clock size={13} className="text-amber-500" />
              : <RotateCcw size={13} className="text-blue-500" />;
            return (
              <div key={t.id} className={`flex items-start justify-between px-5 py-4 hover:bg-muted transition ${t.status === 'reversed' ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <Building2 size={15} className="text-white" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium text-foreground ${t.status === 'reversed' ? 'line-through' : ''}`}>{t.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded-md ${colors.badge}`}>{t.center}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-md border ${svcColor}`}>{t.serviceType}</span>
                      <span className="text-xs text-muted-foreground font-mono">{t.innerNetRef}</span>
                      {t.status === 'reversed' && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-semibold">REVERSED — not counted</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      {statusIcon} <span>{t.status}</span> · <span>{t.date}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ml-3 ${t.status === 'reversed' ? 'text-blue-400 line-through' : 'text-red-500'}`}>
                  -₹{t.amount.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
