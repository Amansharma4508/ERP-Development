'use client';

import { useAuth } from '@/lib/auth-context';
import { useCallback, useEffect, useState } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Database, BookOpen,
  ArrowDownLeft, ArrowUpRight, CheckCircle2,
} from 'lucide-react';

export default function StateWalletPage() {
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

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-28 rounded-2xl"/>)}</div>;
  if (!data) return null;

  const { user, summary, ledger, creditNotes } = data;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">State Wallet Account</h1>
        <p className="text-muted-foreground text-sm mt-1">Master Wallet Account Ledger — Total Fund Allocation &amp; Capital</p>
      </div>

      {/* State wallet hero */}
      <div className="rounded-2xl p-7 text-white relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg,#312e81 0%,#4f46e5 60%,#7c3aed 100%)' }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 -translate-x-1/2 translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Wallet size={24} className="text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest">State Wallet Account</p>
              <p className="font-bold text-lg">{user.cardNumber}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-white/60 text-xs">State Balance</p>
              <p className="text-2xl font-bold">₹{user.stateWalletBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Master Ledger</p>
              <p className="text-2xl font-bold">₹{summary.allocatedAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Net Position</p>
              <p className="text-2xl font-bold">₹{summary.remainingBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Allocated',    value: `₹${summary.allocatedAmount.toLocaleString()}`,   icon: <Database size={16} className="text-indigo-500" />,   bg: 'bg-indigo-50' },
          { label: 'Total Debits',       value: `₹${summary.ledgerDebits.toLocaleString()}`,       icon: <TrendingDown size={16} className="text-red-500" />,   bg: 'bg-red-50'    },
          { label: 'Total Credits',      value: `₹${summary.ledgerCredits.toLocaleString()}`,      icon: <TrendingUp size={16} className="text-emerald-500" />, bg: 'bg-emerald-50'},
          { label: 'Net Ledger',         value: `₹${Math.abs(summary.netLedger).toLocaleString()}`,icon: <BookOpen size={16} className="text-violet-500" />,   bg: 'bg-violet-50' },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 border border-border`}>
            <div className="flex items-center gap-2 mb-2">{icon}<p className="text-xs text-muted-foreground">{label}</p></div>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Credit Summary */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp size={15} className="text-teal-500" /> Credit Summary
        </p>
        <div className="space-y-3">
          {creditNotes.map((cn: any) => (
            <div key={cn.id} className={`flex items-center justify-between p-4 rounded-xl border
              ${cn.isMaster ? 'bg-indigo-50 border-indigo-200' : 'bg-muted border-border'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                  ${cn.isMaster ? 'bg-indigo-100' : 'bg-teal-100'}`}>
                  {cn.isMaster ? <Database size={16} className="text-indigo-600" /> : <CheckCircle2 size={16} className="text-teal-600" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{cn.noteRef}</p>
                  <p className="text-xs text-muted-foreground">{cn.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cn.date} · Issued by {cn.issuedBy}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="text-sm font-bold text-emerald-600">₹{cn.amount.toLocaleString()}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                  ${cn.status === 'applied' ? 'bg-emerald-100 text-emerald-700'
                    : cn.status === 'issued' ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'}`}>
                  {cn.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Master ledger entries */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Master Wallet Ledger Entries</h3>
          <p className="text-xs text-muted-foreground mt-0.5">All posted debit and credit entries</p>
        </div>
        <div className="divide-y divide-border">
          {ledger.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted transition">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                  ${e.entryType === 'credit' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {e.entryType === 'credit'
                    ? <ArrowDownLeft size={16} className="text-emerald-600" />
                    : <ArrowUpRight  size={16} className="text-red-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{e.description}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-xs text-muted-foreground">{e.date}</span>
                    <span className="text-xs bg-muted border border-border px-1.5 py-0.5 rounded-md capitalize">{e.source}</span>
                    {e.creditNoteRef && (
                      <span className="text-xs bg-teal-50 border border-teal-200 text-teal-700 px-1.5 py-0.5 rounded-md">{e.creditNoteRef}</span>
                    )}
                    {e.masterCreditNoteRef && (
                      <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded-md">{e.masterCreditNoteRef}</span>
                    )}
                    <span className="text-xs text-muted-foreground">by {e.postedBy}</span>
                  </div>
                </div>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ml-3
                ${e.entryType === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                {e.entryType === 'credit' ? '+' : '-'}₹{e.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
