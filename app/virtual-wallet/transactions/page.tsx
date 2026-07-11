'use client';

import { useAuth } from '@/lib/auth-context';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  WifiOff, Wifi, CheckCircle2, Clock, AlertCircle, RotateCcw,
  Building2, Smartphone, Globe, FlaskConical, Activity,
  Calendar, Download, Users,
} from 'lucide-react';

type Tab       = 'offline' | 'online';
type DateRange = 'all' | 'this_month' | 'last_30' | 'custom';

const CHANNEL_META: Record<string, { label: string; Icon: any; color: string }> = {
  teleconsult:  { label: 'Teleconsult',  Icon: Smartphone,   color: 'bg-violet-100 text-violet-600'   },
  e_medicine:   { label: 'E-Medicine',   Icon: Activity,     color: 'bg-emerald-100 text-emerald-600' },
  lab_booking:  { label: 'Lab Booking',  Icon: FlaskConical, color: 'bg-blue-100 text-blue-600'       },
  therapy:      { label: 'Therapy',      Icon: Globe,        color: 'bg-pink-100 text-pink-600'       },
};

function filterByDate(items: any[], key: string, range: DateRange, from: string, to: string) {
  const now = new Date();
  return items.filter((t) => {
    const d = new Date(t[key]);
    if (range === 'this_month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (range === 'last_30')    return d >= new Date(Date.now() - 30 * 864e5);
    if (range === 'custom' && from && to) return d >= new Date(from) && d <= new Date(new Date(to).setHours(23,59,59,999));
    return true;
  });
}

function exportCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]).filter(k => typeof rows[0][k] !== 'object');
  const csv  = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const { token } = useAuth();
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>('offline');
  const [range, setRange]     = useState<DateRange>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;
    const res  = await fetch('/api/virtual-wallet', { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { filteredOffline, filteredOnline } = useMemo(() => {
    if (!data) return { filteredOffline: [], filteredOnline: [] };
    return {
      filteredOffline: filterByDate(data.offline, 'date', range, customFrom, customTo),
      filteredOnline:  filterByDate(data.online,  'date', range, customFrom, customTo),
    };
  }, [data, range, customFrom, customTo]);

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_,i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>;
  if (!data) return null;

  const { summary, familyMembers } = data;
  // Build a quick map of familyMember UID → name for display
  const memberMap: Record<string, string> = {};
  (familyMembers ?? []).forEach((m: any) => { memberMap[m.uid] = m.fullName; });

  const filteredOfflineSpent = filteredOffline.filter((t: any) => t.status === 'posted').reduce((s: number, t: any) => s + t.amount, 0);
  const filteredOnlineSpent  = filteredOnline.filter((t: any)  => t.status === 'success').reduce((s: number, t: any) => s + t.amount, 0);
  const isFiltered = range !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-1">All offline center visits and online gateway payments</p>
        </div>
        <button
          onClick={() => exportCSV(tab === 'offline' ? filteredOffline : filteredOnline, `transactions-${tab}.csv`)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* ── Date filter ───────────────────────────────────────────────────── */}
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
              className="px-2 py-1.5 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
            <span className="text-xs text-muted-foreground">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        )}
      </div>

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: isFiltered ? 'Offline (filtered)' : 'Offline Total', value: `₹${(isFiltered ? filteredOfflineSpent : summary.totalOfflineSpent).toLocaleString()}`, sub: `${filteredOffline.filter((t:any)=>t.status==='posted').length} posted`, color: 'bg-amber-50 border-amber-200',   text: 'text-amber-700'    },
          { label: isFiltered ? 'Online (filtered)'  : 'Online Total',  value: `₹${(isFiltered ? filteredOnlineSpent  : summary.totalOnlineSpent).toLocaleString()}`,  sub: `${filteredOnline.filter((t:any)=>t.status==='success').length} success`, color: 'bg-violet-50 border-violet-200', text: 'text-violet-700'   },
          { label: 'All-time Total Spent',  value: `₹${summary.totalSpent.toLocaleString()}`,         sub: 'Excl. reversed/refunded', color: 'bg-red-50 border-red-200',           text: 'text-red-700'      },
          { label: 'Remaining Balance',     value: `₹${summary.remainingBalance.toLocaleString()}`,   sub: 'Available',               color: 'bg-emerald-50 border-emerald-200',   text: 'text-emerald-700'  },
        ].map(({ label, value, sub, color, text }) => (
          <div key={label} className={`rounded-2xl border p-4 ${color}`}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold mt-0.5 ${text}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tab switcher ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-muted p-1 rounded-2xl w-fit">
        {([
          { key: 'offline', label: 'Offline Centers', Icon: WifiOff,  color: 'text-amber-500',  count: filteredOffline.length,  badge: 'bg-amber-100 text-amber-700'  },
          { key: 'online',  label: 'Online Gateway',  Icon: Wifi,     color: 'text-violet-500', count: filteredOnline.length,   badge: 'bg-violet-100 text-violet-700'},
        ] as const).map(({ key, label, Icon, color, count, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition
              ${tab === key ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon size={15} className={color} />
            {label}
            <span className={`px-1.5 py-0.5 text-xs rounded-full font-bold ${badge}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* ── Offline tab ───────────────────────────────────────────────────── */}
      {tab === 'offline' && (
        <div className="bg-card rounded-2xl border border-border">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Offline Transactions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Physical center visits — inner net expense details. Reversed transactions not counted in totals.</p>
          </div>
          <div className="divide-y divide-border">
            {filteredOffline.length === 0 ? (
              <p className="text-center py-10 text-sm text-muted-foreground">No transactions in selected range</p>
            ) : filteredOffline.map((t: any) => {
              const statusIcon = t.status === 'posted'  ? <CheckCircle2 size={13} className="text-emerald-500" />
                : t.status === 'pending' ? <Clock size={13} className="text-amber-500" />
                : <RotateCcw size={13} className="text-blue-500" />;
              return (
                <div key={t.id} className={`flex items-center justify-between px-5 py-4 hover:bg-muted transition ${t.status === 'reversed' ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Building2 size={17} className="text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium text-foreground truncate ${t.status === 'reversed' ? 'line-through' : ''}`}>{t.description}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded-md">{t.center}</span>
                        <span className="text-xs bg-muted border border-border px-1.5 py-0.5 rounded-md">{t.serviceType}</span>
                        <span className="font-mono text-xs text-muted-foreground">{t.innerNetRef}</span>
                        {t.familyMemberUid && (
                          <span className="text-xs bg-pink-50 border border-pink-200 text-pink-700 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Users size={10} /> {memberMap[t.familyMemberUid] ?? t.familyMemberUid}
                          </span>
                        )}
                        {t.status === 'reversed' && (
                          <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded-md font-semibold">REVERSED</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        {statusIcon} {t.status} · {t.date} · {t.attendedBy}
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ml-4 ${t.status === 'reversed' ? 'text-blue-400 line-through' : 'text-red-500'}`}>
                    -₹{t.amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Online tab ────────────────────────────────────────────────────── */}
      {tab === 'online' && (
        <div className="bg-card rounded-2xl border border-border">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Online Transactions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Teleconsult App / E-Medical — Payment Gateway. Refunded & pending excluded from spend totals.</p>
          </div>
          <div className="divide-y divide-border">
            {filteredOnline.length === 0 ? (
              <p className="text-center py-10 text-sm text-muted-foreground">No transactions in selected range</p>
            ) : filteredOnline.map((t: any) => {
              const meta = CHANNEL_META[t.channel] ?? { label: t.channel, Icon: Globe, color: 'bg-muted text-muted-foreground' };
              const statusStyle = t.status === 'success'  ? 'bg-emerald-100 text-emerald-700'
                : t.status === 'pending'  ? 'bg-amber-100 text-amber-700'
                : t.status === 'refunded' ? 'bg-blue-100 text-blue-700'
                : 'bg-red-100 text-red-700';
              const statusIcon = t.status === 'success'  ? <CheckCircle2 size={13} />
                : t.status === 'pending'  ? <Clock size={13} />
                : t.status === 'refunded' ? <RotateCcw size={13} />
                : <AlertCircle size={13} />;
              return (
                <div key={t.id} className={`flex items-center justify-between px-5 py-4 hover:bg-muted transition ${t.status === 'refunded' || t.status === 'failed' ? 'opacity-70' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                      <meta.Icon size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-xs bg-violet-50 border border-violet-200 text-violet-700 px-1.5 py-0.5 rounded-md">{meta.label}</span>
                        <span className="font-mono text-xs text-muted-foreground">{t.gatewayRef}</span>
                        {t.creditNoteRef && (
                          <span className="text-xs bg-teal-50 border border-teal-200 text-teal-700 px-1.5 py-0.5 rounded-md">{t.creditNoteRef}</span>
                        )}
                        {t.familyMemberUid && (
                          <span className="text-xs bg-pink-50 border border-pink-200 text-pink-700 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Users size={10} /> {memberMap[t.familyMemberUid] ?? t.familyMemberUid}
                          </span>
                        )}
                      </div>
                      <div className={`inline-flex items-center gap-1 mt-1 text-xs font-medium px-1.5 py-0.5 rounded-full ${statusStyle}`}>
                        {statusIcon} {t.status} · {t.date}
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ml-4
                    ${t.status === 'refunded' ? 'text-emerald-500' : t.status === 'failed' ? 'text-muted-foreground' : t.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>
                    {t.status === 'refunded' ? '+' : t.status === 'failed' ? '' : '-'}₹{t.amount.toLocaleString()}
                    {(t.status === 'refunded' || t.status === 'failed' || t.status === 'pending') && (
                      <span className="block text-[10px] font-normal text-muted-foreground">not counted</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
