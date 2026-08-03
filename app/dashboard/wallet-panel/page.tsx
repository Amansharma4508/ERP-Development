'use client';

import { useAuth } from '@/lib/auth-context';
import { useCallback, useEffect, useState } from 'react';
import { WalletCard } from '@/components/wallet/WalletCard';
import type { WalletCardTransaction } from '@/components/wallet/WalletCard';
import {
  Wallet, Users, Stethoscope, Truck, ShieldAlert, CheckCircle2,
  TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw,
  ArrowDownLeft, ArrowUpRight, Clock, LayoutGrid, List,
  PauseCircle, PlayCircle, Globe,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserWalletEntry {
  userId: string; fullName: string; email: string; role: string;
  balance: number; totalCredit: number; totalDebit: number; txnCount: number;
  recentTxns: WalletCardTransaction[];
  paymentPaused: boolean; pauseReason: string | null; controlId: string | null;
}

interface DocWalletEntry {
  doctorId: string; doctorName: string; specialization: string;
  balance: number; totalEarned: number; totalWithdrawn: number; pendingSettlement: number;
  txnCount: number; recentTxns: WalletCardTransaction[];
  paymentPaused: boolean; pauseReason: string | null; controlId: string | null;
}

interface LogisticsData {
  id: string; balance: number; totalIncome: number; totalExpense: number; pendingPayouts: number;
  recentLedger: { id: string; type: string; category: string; amount: number; description: string; date: string }[];
  paymentPaused: boolean; pauseReason: string | null; controlId: string | null;
}

interface SystemControl {
  paused: boolean; pauseReason: string | null; controlId: string | null;
}

interface ActivityEntry {
  id: string; entityType: string; entityName: string;
  action: string; amount?: number; performedBy: string; timestamp: string;
}

interface PaymentControlEntry {
  id: string; entityType: string; entityName: string;
  paused: boolean; pauseReason?: string;
}

interface DashboardData {
  summary: {
    totalUserBalance: number; totalDoctorBalance: number;
    logisticsBalance: number; totalSystemFunds: number;
    activePauses: number; totalWallets: number;
  };
  userWallets: UserWalletEntry[];
  doctorWallets: DocWalletEntry[];
  logistics: LogisticsData;
  systemControl: SystemControl;
  recentActivity: ActivityEntry[];
  paymentControls: PaymentControlEntry[];
}

type ViewMode = 'grid' | 'list';
type ActiveTab = 'overview' | 'users' | 'doctors' | 'logistics' | 'activity';

// ── Helper components ─────────────────────────────────────────────────────────
function SummaryCard({
  label, value, sub, Icon, gradient, alert = false,
}: {
  label: string; value: string; sub?: string;
  Icon: React.ElementType; gradient: string; alert?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-lg ${gradient} relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 bg-white" />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-white/70 text-xs font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold leading-tight">{value}</p>
          {sub && <p className="text-white/60 text-xs mt-1.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
          ${alert ? 'bg-red-400/40' : 'bg-white/20'}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  payment_paused:  { label: 'Paused',     color: 'text-red-600 bg-red-50'     },
  payment_resumed: { label: 'Resumed',    color: 'text-emerald-600 bg-emerald-50' },
  top_up:          { label: 'Top-up',     color: 'text-indigo-600 bg-indigo-50'   },
  withdrawal:      { label: 'Withdrawal', color: 'text-amber-600 bg-amber-50'     },
  settlement:      { label: 'Settlement', color: 'text-blue-600 bg-blue-50'       },
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WalletDashboardPage() {
  const { token, user } = useAuth();
  const [data, setData]           = useState<DashboardData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [viewMode, setViewMode]   = useState<ViewMode>('grid');
  const [toggling, setToggling]   = useState<string | null>(null);   // controlId being toggled
  const [toast, setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/wallet-dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Failed to load');
      setData(json.data);
    } catch (e: any) {
      setError(e.message ?? 'Could not load wallet dashboard');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Pause / Resume handler ──────────────────────────────────────────────
  const handleTogglePause = async (
    controlId: string, action: 'pause' | 'resume', reason?: string,
  ) => {
    if (!token) return;
    setToggling(controlId);
    try {
      const res = await fetch('/api/wallet-dashboard/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ controlId, action, reason }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Control action failed');
      showToast(json.data.message, 'success');
      await fetchData();   // refresh
    } catch (e: any) {
      showToast(e.message ?? 'Action failed', 'error');
    } finally {
      setToggling(null);
    }
  };

  // ── Global system pause/resume ───────────────────────────────────────────
  const handleGlobalToggle = async () => {
    if (!data?.systemControl.controlId) return;
    await handleTogglePause(
      data.systemControl.controlId,
      data.systemControl.paused ? 'resume' : 'pause',
      data.systemControl.paused ? undefined : 'Global payment freeze by admin',
    );
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <ShieldAlert size={48} className="text-red-400" />
        <p className="text-lg font-semibold text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, userWallets, doctorWallets, logistics, systemControl, recentActivity } = data;
  const isAdmin = user?.role === 'admin';
  const allPaused = systemControl.paused;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium
          flex items-center gap-2 animate-fade-in-up
          ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Global Alert Banner */}
      {allPaused && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-50 border-2 border-red-300">
          <ShieldAlert size={20} className="text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700">GLOBAL PAYMENT FREEZE ACTIVE</p>
            <p className="text-xs text-red-600 mt-0.5">All payment flows across the system are paused.</p>
          </div>
          {isAdmin && (
            <button onClick={handleGlobalToggle} disabled={toggling === systemControl.controlId}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition">
              <PlayCircle size={14} /> Resume All
            </button>
          )}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet size={24} className="text-indigo-500" /> Wallet Control Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor and control all payment flows — users, doctors &amp; logistics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Global freeze toggle */}
          {isAdmin && (
            <button onClick={handleGlobalToggle}
              disabled={toggling === systemControl.controlId}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition
                ${allPaused
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'}`}>
              {toggling === systemControl.controlId
                ? <Clock size={15} className="animate-spin" />
                : allPaused ? <Globe size={15} /> : <Globe size={15} />
              }
              {allPaused ? 'Lift Global Freeze' : 'Global Freeze'}
            </button>
          )}
          <button onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground
              border border-border hover:bg-muted transition">
            <RefreshCw size={14} /> Refresh
          </button>
          {/* View toggle */}
          <div className="flex bg-muted rounded-xl p-1 gap-1">
            <button onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow text-foreground' : 'text-muted-foreground'}`}>
              <LayoutGrid size={14} />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow text-foreground' : 'text-muted-foreground'}`}>
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total System Funds"
          value={`$${summary.totalSystemFunds.toLocaleString()}`}
          sub={`${summary.totalWallets} wallets`}
          Icon={DollarSign}
          gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
        />
        <SummaryCard
          label="User Wallet Balance"
          value={`$${summary.totalUserBalance.toLocaleString()}`}
          sub={`${userWallets.length} user accounts`}
          Icon={Users}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <SummaryCard
          label="Doctor Earnings"
          value={`$${summary.totalDoctorBalance.toLocaleString()}`}
          sub={`${doctorWallets.length} doctors`}
          Icon={Stethoscope}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <SummaryCard
          label="Active Pauses"
          value={String(summary.activePauses)}
          sub={summary.activePauses > 0 ? 'Requires attention' : 'All flows normal'}
          Icon={summary.activePauses > 0 ? ShieldAlert : CheckCircle2}
          gradient={summary.activePauses > 0
            ? 'bg-gradient-to-br from-red-500 to-rose-600'
            : 'bg-gradient-to-br from-emerald-500 to-green-600'}
          alert={summary.activePauses > 0}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-2xl w-fit flex-wrap">
        {([
          { key: 'overview',   label: 'Overview',   Icon: LayoutGrid },
          { key: 'users',      label: 'Users',      Icon: Users      },
          { key: 'doctors',    label: 'Doctors',    Icon: Stethoscope},
          { key: 'logistics',  label: 'Logistics',  Icon: Truck      },
          { key: 'activity',   label: 'Activity Log',Icon: Activity  },
        ] as const).map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition
              ${activeTab === key ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Payment flow status strip */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity size={16} className="text-indigo-500" /> Payment Flow Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'User Payments',      paused: userWallets.some(w => w.paymentPaused),     color: 'indigo', Icon: Users      },
                { label: 'Doctor Payouts',     paused: doctorWallets.some(w => w.paymentPaused),   color: 'emerald', Icon: Stethoscope },
                { label: 'Logistics Payments', paused: logistics.paymentPaused,                     color: 'amber',   Icon: Truck      },
                { label: 'Global System',      paused: systemControl.paused,                         color: 'violet',  Icon: Globe      },
              ].map(({ label, paused, Icon }) => (
                <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border
                  ${paused ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                    ${paused ? 'bg-red-100' : 'bg-emerald-100'}`}>
                    <Icon size={16} className={paused ? 'text-red-600' : 'text-emerald-600'} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
                    <p className={`text-xs font-medium ${paused ? 'text-red-500' : 'text-emerald-600'}`}>
                      {paused ? 'PAUSED' : 'Active'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick wallet summary — all 3 sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Users aggregate */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Users size={15} className="text-indigo-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">User Wallets</p>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">${summary.totalUserBalance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mb-4">{userWallets.length} wallets · {userWallets.filter(w => w.paymentPaused).length} paused</p>
              <div className="space-y-2">
                {userWallets.map(w => (
                  <div key={w.userId} className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium truncate max-w-[120px]">{w.fullName}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">${w.balance.toLocaleString()}</span>
                      {w.paymentPaused && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Doctors aggregate */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Stethoscope size={15} className="text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">Doctor Wallets</p>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">${summary.totalDoctorBalance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mb-4">{doctorWallets.length} doctors · {doctorWallets.filter(d => d.paymentPaused).length} paused</p>
              <div className="space-y-2">
                {doctorWallets.map(d => (
                  <div key={d.doctorId} className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium truncate max-w-[120px]">{d.doctorName}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">${d.balance.toLocaleString()}</span>
                      {d.paymentPaused && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Logistics aggregate */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Truck size={15} className="text-amber-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">Logistics Wallet</p>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">${logistics.balance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mb-4">Net operating balance</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Income</span>
                  <span className="font-bold text-emerald-600">+${logistics.totalIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Expense</span>
                  <span className="font-bold text-red-600">-${logistics.totalExpense.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Pending Payouts</span>
                  <span className="font-bold text-amber-600">${logistics.pendingPayouts.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── USERS TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {userWallets.length} user wallet{userWallets.length !== 1 ? 's' : ''} ·{' '}
              <span className="text-foreground font-medium">
                ${summary.totalUserBalance.toLocaleString()} total
              </span>
            </p>
            {userWallets.some(w => w.paymentPaused) && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                <PauseCircle size={13} />
                {userWallets.filter(w => w.paymentPaused).length} paused
              </div>
            )}
          </div>
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
            : 'flex flex-col gap-3'}>
            {userWallets.map((w) => (
              <WalletCard
                key={w.userId}
                entityType="user"
                name={w.fullName}
                subtitle={w.email}
                balance={w.balance}
                totalIn={w.totalCredit}
                totalOut={w.totalDebit}
                txnCount={w.txnCount}
                recentTxns={w.recentTxns}
                paymentPaused={w.paymentPaused}
                pauseReason={w.pauseReason}
                controlId={w.controlId}
                onTogglePause={handleTogglePause}
                toggling={toggling === w.controlId}
                showControls={isAdmin}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── DOCTORS TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {doctorWallets.length} doctor wallet{doctorWallets.length !== 1 ? 's' : ''} ·{' '}
              <span className="text-foreground font-medium">
                ${summary.totalDoctorBalance.toLocaleString()} total balance
              </span>
            </p>
            {doctorWallets.some(d => d.paymentPaused) && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                <PauseCircle size={13} />
                {doctorWallets.filter(d => d.paymentPaused).length} paused
              </div>
            )}
          </div>
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
            : 'flex flex-col gap-3'}>
            {doctorWallets.map((d) => (
              <WalletCard
                key={d.doctorId}
                entityType="doctor"
                name={d.doctorName}
                subtitle={d.specialization}
                balance={d.balance}
                totalIn={d.totalEarned}
                totalOut={d.totalWithdrawn}
                pending={d.pendingSettlement}
                txnCount={d.txnCount}
                recentTxns={d.recentTxns}
                paymentPaused={d.paymentPaused}
                pauseReason={d.pauseReason}
                controlId={d.controlId}
                onTogglePause={handleTogglePause}
                toggling={toggling === d.controlId}
                showControls={isAdmin}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── LOGISTICS TAB ────────────────────────────────────────────────── */}
      {activeTab === 'logistics' && (
        <div className="space-y-5">
          {/* Logistics wallet card */}
          <div className={`bg-card rounded-2xl border-2 transition-all
            ${logistics.paymentPaused ? 'border-red-300' : 'border-amber-200'}`}>
            {logistics.paymentPaused && (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-red-50 rounded-t-2xl border-b border-red-200">
                <ShieldAlert size={14} className="text-red-500" />
                <p className="text-xs font-semibold text-red-600">
                  LOGISTICS PAYMENTS PAUSED{logistics.pauseReason ? ` — ${logistics.pauseReason}` : ''}
                </p>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                    <Truck size={22} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Logistics Department</h3>
                    <p className="text-xs text-muted-foreground">Freight &amp; supply chain payments</p>
                  </div>
                </div>
                {isAdmin && logistics.controlId && (
                  <button
                    onClick={() => handleTogglePause(
                      logistics.controlId!,
                      logistics.paymentPaused ? 'resume' : 'pause',
                      logistics.paymentPaused ? undefined : 'Admin action',
                    )}
                    disabled={toggling === logistics.controlId}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition
                      ${logistics.paymentPaused
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'}`}>
                    {toggling === logistics.controlId
                      ? <Clock size={14} className="animate-spin" />
                      : logistics.paymentPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />
                    }
                    {logistics.paymentPaused ? 'Resume Payments' : 'Pause Payments'}
                  </button>
                )}
              </div>

              {/* Balance + stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Net Balance',    value: `$${logistics.balance.toLocaleString()}`,       color: 'text-foreground',    bg: 'bg-muted'          },
                  { label: 'Total Income',   value: `$${logistics.totalIncome.toLocaleString()}`,   color: 'text-emerald-600',   bg: 'bg-emerald-50'     },
                  { label: 'Total Expense',  value: `$${logistics.totalExpense.toLocaleString()}`,  color: 'text-red-600',       bg: 'bg-red-50'         },
                  { label: 'Pending Payouts',value: `$${logistics.pendingPayouts.toLocaleString()}`,color: 'text-amber-600',     bg: 'bg-amber-50'       },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl p-4`}>
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Recent ledger */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Recent Ledger Entries</p>
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="divide-y divide-border">
                    {logistics.recentLedger.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted transition">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                            ${entry.type === 'credit' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                            {entry.type === 'credit'
                              ? <ArrowDownLeft size={14} className="text-emerald-600" />
                              : <ArrowUpRight  size={14} className="text-red-600" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{entry.description}</p>
                            <p className="text-xs text-muted-foreground">{entry.date} · {entry.category}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${entry.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {entry.type === 'credit' ? '+' : '-'}${entry.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVITY LOG TAB ─────────────────────────────────────────────── */}
      {activeTab === 'activity' && (
        <div className="bg-card rounded-2xl border border-border">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground">Wallet Activity Log</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                All top-ups, settlements, pauses &amp; resumes across all wallets
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              {recentActivity.length} events
            </span>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.length === 0 ? (
              <div className="text-center py-12">
                <Activity size={36} className="mx-auto mb-2 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">No activity recorded yet</p>
              </div>
            ) : recentActivity.map((entry) => {
              const meta = ACTION_LABELS[entry.action] ?? { label: entry.action, color: 'text-muted-foreground bg-muted' };
              const entityColors: Record<string, string> = {
                user:      'bg-indigo-100 text-indigo-700',
                doctor:    'bg-emerald-100 text-emerald-700',
                logistics: 'bg-amber-100 text-amber-700',
                system:    'bg-violet-100 text-violet-700',
              };
              return (
                <div key={entry.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted transition">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                    ${entry.action === 'payment_paused'  ? 'bg-red-100' :
                      entry.action === 'payment_resumed' ? 'bg-emerald-100' :
                      entry.action === 'top_up'          ? 'bg-indigo-100' :
                      entry.action === 'settlement'      ? 'bg-blue-100' : 'bg-amber-100'}`}>
                    {entry.action === 'payment_paused'  ? <PauseCircle  size={16} className="text-red-600" /> :
                     entry.action === 'payment_resumed' ? <PlayCircle   size={16} className="text-emerald-600" /> :
                     entry.action === 'top_up'          ? <TrendingUp   size={16} className="text-indigo-600" /> :
                     entry.action === 'settlement'      ? <CheckCircle2 size={16} className="text-blue-600" /> :
                                                          <TrendingDown  size={16} className="text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{entry.entityName}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${entityColors[entry.entityType] ?? 'bg-muted text-muted-foreground'}`}>
                        {entry.entityType}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      by {entry.performedBy} · {new Date(entry.timestamp).toLocaleString('en-US', {
                        dateStyle: 'medium', timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  {entry.amount != null && (
                    <span className="text-sm font-bold text-foreground flex-shrink-0">
                      ${entry.amount.toLocaleString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pause controls quick reference (admin only, at bottom of every tab) */}
      {isAdmin && activeTab !== 'activity' && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShieldAlert size={15} className="text-red-500" /> All Payment Controls
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
            {data.paymentControls.map((ctrl: PaymentControlEntry) => (
              <div key={ctrl.id} className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs
                ${ctrl.paused ? 'bg-red-50 border-red-200' : 'bg-muted border-border'}`}>
                <span className={`font-medium truncate max-w-[90px] ${ctrl.paused ? 'text-red-700' : 'text-foreground'}`}>
                  {ctrl.entityName}
                </span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ml-1 ${ctrl.paused ? 'bg-red-500' : 'bg-emerald-500'}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
