'use client';

import { useAuth } from '@/lib/auth-context';
import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet, UserCheck, CreditCard, Building2, WifiOff, Wifi,
  BookOpen, FileText, ArrowRight, CheckCircle2, Clock,
  AlertCircle, ShieldCheck, AlertTriangle, Download,
  ChevronRight, Calendar, Users,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface BreadcrumbItem { label: string; value: string; }
interface WalletData {
  user: {
    fullName: string; cardNumber: string; enrollmentStatus: string;
    cardScanStatus: string; centerAssigned: string; activationDate?: string;
    allocatedAmount: number; offlineBalance: number; onlineBalance: number;
    stateWalletBalance: number; enrollmentDate: string;
  };
  summary: {
    allocatedAmount: number; totalSpent: number;
    totalOfflineSpent: number; totalOnlineSpent: number;
    totalCreditNotes: number; remainingBalance: number;
    isLowBalance: boolean; lowBalanceThreshold: number;
    creditNoteAuditWarning: string | null;
    ledgerDebits: number; ledgerCredits: number; netLedger: number;
  };
  centerBreakdown: { center: string; centerName: string; txnCount: number; totalSpent: number }[];
  offline: any[]; online: any[]; creditNotes: any[];
  breadcrumb: BreadcrumbItem[];
}

type DateRange = 'all' | 'this_month' | 'last_30' | 'custom';

const SECTIONS = [
  { name: 'Enrollment',      href: '/virtual-wallet/enrollment',    Icon: UserCheck,  color: 'from-indigo-500 to-indigo-600',   desc: 'Card status & activation'    },
  { name: 'Fund Allocation', href: '/virtual-wallet/allocation',    Icon: CreditCard, color: 'from-teal-500 to-teal-600',      desc: '₹35,000 debit distribution'  },
  { name: 'Center Wallet',   href: '/virtual-wallet/center-wallet', Icon: Building2,  color: 'from-amber-500 to-amber-600',    desc: 'S1 / S2 / S3 / DHS expenses' },
  { name: 'State Wallet',    href: '/virtual-wallet/state-wallet',  Icon: Wallet,     color: 'from-violet-500 to-violet-600',  desc: 'Master ledger & capital'     },
  { name: 'Transactions',    href: '/virtual-wallet/transactions',  Icon: WifiOff,    color: 'from-rose-500 to-rose-600',      desc: 'Offline + online history'    },
  { name: 'Ledger',          href: '/virtual-wallet/ledger',        Icon: BookOpen,   color: 'from-blue-500 to-blue-600',      desc: 'Credit notes & main ledger'  },
  { name: 'Final Summary',   href: '/virtual-wallet/summary',       Icon: FileText,   color: 'from-emerald-500 to-emerald-600',desc: 'Complete audit trail'        },
  { name: 'Family Members',  href: '/virtual-wallet/family',        Icon: Users,      color: 'from-pink-500 to-rose-500',      desc: 'Linked family cards'         },
];

// ── Date filter helpers ───────────────────────────────────────────────────────
function filterByDate(items: any[], dateKey: string, range: DateRange, from: string, to: string) {
  const now  = new Date();
  const sod  = (d: Date) => { d.setHours(0,0,0,0); return d; };
  return items.filter((t) => {
    const d = new Date(t[dateKey]);
    if (range === 'this_month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (range === 'last_30') {
      return d >= new Date(Date.now() - 30 * 864e5);
    }
    if (range === 'custom' && from && to) {
      return d >= sod(new Date(from)) && d <= new Date(new Date(to).setHours(23,59,59,999));
    }
    return true;
  });
}

// ── Export helper (CSV) ───────────────────────────────────────────────────────
function exportCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]).filter(k => typeof rows[0][k] !== 'object');
  const csv  = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function CardApplicationForm() {
  const [form, setForm] = useState({
    fullName: '', fatherName: '', motherName: '', email: '', password: '',
    dob: '', gender: 'female', qualification: '', district: '', state: '', pinCode: '',
    centerAssigned: 'S1', consentGiven: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      form.fullName.trim() !== '' &&
      form.fatherName.trim() !== '' &&
      form.motherName.trim() !== '' &&
      form.email.trim() !== '' &&
      form.password.trim().length >= 6 &&
      form.district.trim() !== '' &&
      form.state.trim() !== '' &&
      form.pinCode.trim().length >= 4 &&
      form.consentGiven
    );
  }, [form]);

  const handleChange = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!canSubmit) {
      setError('Please complete all required fields and give consent.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'wallet_user' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Submission failed.');
      } else {
        setMessage('Application submitted successfully. Please login for next steps.');
        setForm({
          fullName: '', fatherName: '', motherName: '', email: '', password: '',
          dob: '', gender: 'female', qualification: '', district: '', state: '', pinCode: '',
          centerAssigned: 'S1', consentGiven: false,
        });
      }
    } catch {
      setError('Network error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">SWAB Card Application</h2>
          <p className="text-sm text-muted-foreground">Fill the form to apply for the virtual wallet card.</p>
        </div>
        <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">Shown in wallet</span>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: 'Full Name *', key: 'fullName', type: 'text' },
            { label: 'Father’s Name *', key: 'fatherName', type: 'text' },
            { label: 'Mother’s Name *', key: 'motherName', type: 'text' },
            { label: 'Email *', key: 'email', type: 'email' },
            { label: 'Password *', key: 'password', type: 'password' },
            { label: 'DOB', key: 'dob', type: 'date' },
            { label: 'State *', key: 'state', type: 'text' },
            { label: 'District *', key: 'district', type: 'text' },
            { label: 'PIN Code *', key: 'pinCode', type: 'text' },
            { label: 'Qualification', key: 'qualification', type: 'text' },
          ].map((field) => (
            <label key={field.key} className="block">
              <span className="text-sm font-medium text-foreground">{field.label}</span>
              <input
                type={field.type}
                value={(form as any)[field.key]}
                onChange={(event) => handleChange(field.key, event.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </label>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Gender</span>
            <select
              value={form.gender}
              onChange={(event) => handleChange('gender', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              {['female', 'male', 'other'].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Center Assigned</span>
            <select
              value={form.centerAssigned}
              onChange={(event) => handleChange('centerAssigned', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              {['S1', 'S2', 'S3', 'DHS'].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.consentGiven}
              onChange={(event) => handleChange('consentGiven', event.target.checked)}
              className="h-4 w-4 rounded border-border text-teal-600 focus:ring-teal-500"
            />
            I consent to data processing
          </label>
        </div>
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="inline-flex items-center justify-center rounded-3xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}

export default function VirtualWalletOverview() {
  const { token } = useAuth();
  const [data, setData]         = useState<WalletData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [range, setRange]       = useState<DateRange>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res  = await fetch('/api/virtual-wallet', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { filteredOffline, filteredOnline } = useMemo(() => {
    if (!data) return { filteredOffline: [], filteredOnline: [] };
    return {
      filteredOffline: filterByDate(data.offline, 'date', range, customFrom, customTo),
      filteredOnline:  filterByDate(data.online,  'date', range, customFrom, customTo),
    };
  }, [data, range, customFrom, customTo]);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="skeleton h-32 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
    </div>
  );

  if (!data) return null;
  const { user, summary, centerBreakdown, creditNotes, breadcrumb } = data;
  const spentPct = Math.min(100, (summary.totalSpent / summary.allocatedAmount) * 100);

  // Filtered summary recalc
  const filteredOfflineSpent = filteredOffline.filter((t: any) => t.status === 'posted').reduce((s: number, t: any) => s + t.amount, 0);
  const filteredOnlineSpent  = filteredOnline.filter((t: any)  => t.status === 'success').reduce((s: number, t: any) => s + t.amount, 0);
  const filteredTotalSpent   = filteredOfflineSpent + filteredOnlineSpent;
  const isFiltered = range !== 'all';

  const statusColor: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-50', enrolled: 'text-blue-600 bg-blue-50',
    card_printed: 'text-amber-600 bg-amber-50', dispatched: 'text-violet-600 bg-violet-50',
  };

  return (
    <div className="space-y-6">
      {/* ── Low balance alert ─────────────────────────────────────────────── */}
      {summary.isLowBalance && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300">
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700">Wallet Balance Low</p>
            <p className="text-xs text-amber-600 mt-0.5">
              ₹{summary.remainingBalance.toLocaleString()} remaining — below 20% threshold (₹{summary.lowBalanceThreshold.toLocaleString()}). Refill may be required.
            </p>
          </div>
        </div>
      )}

      {/* ── Audit warning ─────────────────────────────────────────────────── */}
      {summary.creditNoteAuditWarning && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-50 border border-red-300 text-red-700 text-xs font-medium">
          <AlertCircle size={16} className="shrink-0" />
          {summary.creditNoteAuditWarning}
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {user.fullName.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Your Virtual Wallet overview — all flows in one place</p>
        </div>
        <button
          onClick={() => exportCSV([...filteredOffline, ...filteredOnline], 'wallet-overview.csv')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 flex-wrap text-xs text-muted-foreground bg-muted px-4 py-2.5 rounded-xl">
        {breadcrumb.map((b, i) => (
          <span key={b.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-border" />}
            <span className="font-semibold text-foreground">{b.label}</span>
            <span className="text-muted-foreground">({b.value})</span>
          </span>
        ))}
      </div>

      <CardApplicationForm />

      {/* ── Date range filter ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar size={14} className="text-muted-foreground" />
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {(['all','this_month','last_30','custom'] as DateRange[]).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                ${range === r ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {r === 'all' ? 'All Time' : r === 'this_month' ? 'This Month' : r === 'last_30' ? 'Last 30 Days' : 'Custom'}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            <span className="text-xs text-muted-foreground">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        )}
        {isFiltered && (
          <span className="text-xs text-teal-600 font-medium">
            Showing: ₹{filteredTotalSpent.toLocaleString()} spent ({filteredOffline.length + filteredOnline.length} txns)
          </span>
        )}
      </div>

      {/* ── Balance cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Allocated',   value: `₹${summary.allocatedAmount.toLocaleString()}`,                   sub: 'State fund',         color: 'bg-linear-to-br from-teal-500 to-cyan-600',     Icon: Wallet      },
          { label: 'Remaining Balance', value: `₹${summary.remainingBalance.toLocaleString()}`,                  sub: 'Available to spend', color: `bg-linear-to-br ${summary.isLowBalance ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-teal-600'}`, Icon: ShieldCheck },
          { label: isFiltered ? 'Offline (filtered)' : 'Offline Spent',  value: `₹${(isFiltered ? filteredOfflineSpent : summary.totalOfflineSpent).toLocaleString()}`, sub: 'Center visits', color: 'bg-linear-to-br from-amber-500 to-orange-600', Icon: WifiOff },
          { label: isFiltered ? 'Online (filtered)'  : 'Online Spent',   value: `₹${(isFiltered ? filteredOnlineSpent  : summary.totalOnlineSpent).toLocaleString()}`,  sub: 'Teleconsult/E-Med', color: 'bg-linear-to-br from-violet-500 to-indigo-600', Icon: Wifi },
        ].map(({ label, value, sub, color, Icon }) => (
          <div key={label} className={`${color} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <p className="text-white/70 text-xs font-medium">{label}</p>
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Icon size={15} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-white/60 text-xs mt-1">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Spend progress bar ───────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Overall Wallet Usage</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              ₹{summary.totalSpent.toLocaleString()} spent of ₹{summary.allocatedAmount.toLocaleString()} allocated
            </p>
          </div>
          <span className={`text-sm font-bold ${summary.isLowBalance ? 'text-amber-600' : 'text-teal-600'}`}>{spentPct.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div className="h-3 rounded-full transition-all duration-700"
            style={{
              width: `${spentPct}%`,
              background: spentPct > 80 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,#0d9488,#0891b2)',
            }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>₹0</span>
          <span>Offline ₹{summary.totalOfflineSpent.toLocaleString()}</span>
          <span>Online ₹{summary.totalOnlineSpent.toLocaleString()}</span>
          <span>₹{summary.allocatedAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Enrollment flow stepper ──────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-foreground">Enrollment Flow Status</p>
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[user.enrollmentStatus] ?? 'bg-muted text-muted-foreground'}`}>
            {user.enrollmentStatus.replace('_', ' ').toUpperCase()}
          </div>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {['User Enrollment','Data Center Process','Print Card','Dispatch','Scan / Review at S1','Wallet Activated ₹35,000'].map((label, i, arr) => (
            <div key={label} className="flex items-center gap-1 shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-teal-500 text-white">
                  <CheckCircle2 size={14} />
                </div>
                <p className="text-[10px] text-muted-foreground text-center max-w-15 leading-tight">{label}</p>
              </div>
              {i < arr.length - 1 && <div className="h-0.5 w-6 shrink-0 mb-4 bg-teal-400" />}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Card: <strong className="text-foreground">{user.cardNumber}</strong></span>
          <span>Center: <strong className="text-foreground">{user.centerAssigned}</strong></span>
          {user.activationDate && <span>Activated: <strong className="text-foreground">{user.activationDate}</strong></span>}
        </div>
      </div>

      {/* ── Center breakdown mini ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {centerBreakdown.map((c) => (
          <div key={c.center} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                <Building2 size={15} className="text-amber-600" />
              </div>
              <span className="text-xs font-bold text-foreground">{c.center}</span>
            </div>
            <p className="text-xl font-bold text-foreground">₹{c.totalSpent.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{c.txnCount} posted txns</p>
          </div>
        ))}
      </div>

      {/* ── Section quick-links ───────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">All Sections</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SECTIONS.map(({ name, href, Icon, color, desc }) => (
            <Link key={href} href={href}
              className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all group flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${color} flex items-center justify-center`}>
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-teal-600 transition leading-tight">{name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-teal-600 transition mt-auto" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent activity split ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-2xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <WifiOff size={15} className="text-amber-500" />
              <p className="text-sm font-semibold text-foreground">Recent Offline {isFiltered && `(${filteredOffline.length})`}</p>
            </div>
            <Link href="/virtual-wallet/transactions" className="text-xs text-teal-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {filteredOffline.slice(0, 4).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-xs font-medium text-foreground">{t.description}</p>
                  <p className="text-[10px] text-muted-foreground">{t.center} · {t.date}</p>
                </div>
                <span className={`text-sm font-bold ${t.status === 'reversed' ? 'text-blue-500 line-through' : 'text-red-500'}`}>
                  -{t.status === 'reversed' ? '' : ''}₹{t.amount.toLocaleString()}
                </span>
              </div>
            ))}
            {filteredOffline.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No offline transactions in selected range</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Wifi size={15} className="text-violet-500" />
              <p className="text-sm font-semibold text-foreground">Recent Online {isFiltered && `(${filteredOnline.length})`}</p>
            </div>
            <Link href="/virtual-wallet/transactions" className="text-xs text-teal-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {filteredOnline.slice(0, 4).map((t: any) => {
              const icon = t.status === 'success' ? <CheckCircle2 size={11} className="text-emerald-500" />
                : t.status === 'pending' ? <Clock size={11} className="text-amber-500" />
                : <AlertCircle size={11} className="text-red-500" />;
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-xs font-medium text-foreground">{t.description}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      {icon} {t.channel.replace('_', ' ')} · {t.date}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${t.status === 'refunded' ? 'text-emerald-500' : t.status === 'failed' ? 'text-muted-foreground' : 'text-red-500'}`}>
                    {t.status === 'refunded' ? '+' : t.status === 'failed' ? '' : '-'}₹{t.amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
            {filteredOnline.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No online transactions in selected range</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Credit notes mini summary ─────────────────────────────────────── */}
      {creditNotes.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">Credit Notes (non-master total: ₹{summary.totalCreditNotes.toLocaleString()})</p>
            <Link href="/virtual-wallet/ledger" className="text-xs text-teal-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {creditNotes.filter((cn: any) => !cn.isMaster).slice(0, 3).map((cn: any) => {
              const statusColor = cn.status === 'applied' ? 'bg-emerald-100 text-emerald-700'
                : cn.status === 'issued'   ? 'bg-amber-100 text-amber-700'
                : cn.status === 'pending'  ? 'bg-blue-100 text-blue-700'
                : cn.status === 'rejected' ? 'bg-red-100 text-red-700'
                : 'bg-muted text-muted-foreground';
              return (
                <div key={cn.id} className="rounded-xl p-3 border bg-muted border-border">
                  <p className="text-xs font-bold text-foreground">{cn.noteRef}</p>
                  <p className="text-sm font-bold text-teal-600 mt-0.5">₹{cn.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">{cn.description}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1 inline-block ${statusColor}`}>{cn.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
