'use client';

import {
  Pause, Play, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight,
  ShieldAlert, CheckCircle2, Clock, Wallet, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

export interface WalletCardTransaction {
  id: string;
  type: 'credit' | 'debit' | 'settlement';
  amount: number;
  description: string;
  date: string;
}

export interface WalletCardProps {
  /** Entity identifier shown in the header */
  entityType: 'user' | 'doctor' | 'logistics';
  name: string;
  subtitle?: string;
  balance: number;
  totalIn: number;
  totalOut: number;
  pending?: number;
  txnCount?: number;
  recentTxns?: WalletCardTransaction[];
  paymentPaused: boolean;
  pauseReason?: string | null;
  controlId: string | null;
  /** Called when admin clicks Pause / Resume */
  onTogglePause?: (controlId: string, action: 'pause' | 'resume', reason?: string) => Promise<void>;
  /** Whether the toggle is processing */
  toggling?: boolean;
  /** Show controls (admin only) */
  showControls?: boolean;
  accentClass?: string;
  iconBg?: string;
}

const TYPE_COLORS = {
  user:      { ring: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-500'  },
  doctor:    { ring: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  logistics: { ring: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500'   },
};

export function WalletCard({
  entityType, name, subtitle, balance, totalIn, totalOut,
  pending = 0, txnCount = 0, recentTxns = [],
  paymentPaused, pauseReason, controlId,
  onTogglePause, toggling = false, showControls = false,
}: WalletCardProps) {
  const [expanded, setExpanded]       = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReason2, setPauseReason2]     = useState('');

  const colors = TYPE_COLORS[entityType];

  const handlePause = async () => {
    if (!controlId || !onTogglePause) return;
    if (!paymentPaused) {
      setShowPauseModal(true);
    } else {
      await onTogglePause(controlId, 'resume');
    }
  };

  const confirmPause = async () => {
    if (!controlId || !onTogglePause) return;
    await onTogglePause(controlId, 'pause', pauseReason2 || 'Admin action');
    setShowPauseModal(false);
    setPauseReason2('');
  };

  return (
    <>
      <div className={`bg-card rounded-2xl border-2 transition-all duration-200
        ${paymentPaused ? 'border-red-300 shadow-red-100 shadow-lg' : `${colors.ring} shadow-sm hover:shadow-md`}`}>

        {/* Paused Banner */}
        {paymentPaused && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-t-2xl border-b border-red-200">
            <ShieldAlert size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-red-600 truncate">
              PAYMENTS PAUSED{pauseReason ? ` — ${pauseReason}` : ''}
            </p>
          </div>
        )}

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${entityType === 'user' ? 'bg-indigo-100' : entityType === 'doctor' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                <Wallet size={18} className={
                  entityType === 'user' ? 'text-indigo-600' : entityType === 'doctor' ? 'text-emerald-600' : 'text-amber-600'
                } />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{name}</p>
                {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>
                {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
              </span>
              {showControls && controlId && onTogglePause && (
                <button
                  onClick={handlePause}
                  disabled={toggling}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border
                    ${paymentPaused
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {toggling
                    ? <Clock size={12} className="animate-spin" />
                    : paymentPaused ? <Play size={12} /> : <Pause size={12} />
                  }
                  {paymentPaused ? 'Resume' : 'Pause'}
                </button>
              )}
            </div>
          </div>

          {/* Balance */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-0.5">Balance</p>
            <p className={`text-2xl font-bold ${paymentPaused ? 'text-red-500' : 'text-foreground'}`}>
              ${balance.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground">.00</span>
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
              <TrendingUp size={12} className="text-emerald-600 mx-auto mb-0.5" />
              <p className="text-xs font-bold text-emerald-700">${(totalIn / 1000).toFixed(1)}k</p>
              <p className="text-[10px] text-emerald-600">In</p>
            </div>
            <div className="bg-red-50 rounded-xl p-2.5 text-center">
              <TrendingDown size={12} className="text-red-600 mx-auto mb-0.5" />
              <p className="text-xs font-bold text-red-700">${(totalOut / 1000).toFixed(1)}k</p>
              <p className="text-[10px] text-red-600">Out</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-2.5 text-center">
              <Clock size={12} className="text-amber-600 mx-auto mb-0.5" />
              <p className="text-xs font-bold text-amber-700">${pending.toLocaleString()}</p>
              <p className="text-[10px] text-amber-600">Pending</p>
            </div>
          </div>

          {/* Status + expand toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {paymentPaused
                ? <ShieldAlert size={13} className="text-red-500" />
                : <CheckCircle2 size={13} className="text-emerald-500" />
              }
              <span className={`text-xs font-medium ${paymentPaused ? 'text-red-500' : 'text-emerald-600'}`}>
                {paymentPaused ? 'Payments Paused' : 'Active'}
              </span>
            </div>
            {recentTxns.length > 0 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
              >
                {expanded ? 'Hide' : `${txnCount} txns`}
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>
        </div>

        {/* Expanded transactions */}
        {expanded && recentTxns.length > 0 && (
          <div className="border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-2.5">
              Recent Transactions
            </p>
            <div className="divide-y divide-border">
              {recentTxns.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between px-5 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                      ${txn.type === 'credit' ? 'bg-emerald-100' : txn.type === 'settlement' ? 'bg-blue-100' : 'bg-red-100'}`}>
                      {txn.type === 'credit'
                        ? <ArrowDownLeft size={13} className="text-emerald-600" />
                        : txn.type === 'settlement'
                        ? <CheckCircle2 size={13} className="text-blue-600" />
                        : <ArrowUpRight size={13} className="text-red-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{txn.description}</p>
                      <p className="text-[10px] text-muted-foreground">{txn.date}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold flex-shrink-0 ml-2
                    ${txn.type === 'credit' ? 'text-emerald-600' : txn.type === 'settlement' ? 'text-blue-600' : 'text-red-600'}`}>
                    {txn.type === 'debit' ? '-' : '+'}${txn.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pause reason modal */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Pause size={16} className="text-red-500" />
                Pause Payments
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Pausing will block all incoming and outgoing transactions for <strong>{name}</strong>.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Reason <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={pauseReason2}
                  onChange={(e) => setPauseReason2(e.target.value)}
                  placeholder="e.g. Suspicious activity, compliance review…"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPauseModal(false); setPauseReason2(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPause}
                  disabled={toggling}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-50"
                >
                  {toggling ? 'Pausing…' : 'Confirm Pause'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
