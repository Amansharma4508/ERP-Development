'use client';

import { useAuth } from '@/lib/auth-context';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  BookOpen, ArrowDownLeft, ArrowUpRight, CheckCircle2,
  Database, FileText, Calendar, Download, AlertCircle,
} from 'lucide-react';

type EntryFilter = 'all' | 'debit' | 'credit';
type DateRange   = 'all' | 'this_month' | 'last_30' | 'custom';

const SOURCE_COLOR: Record<string, string> = {
  offline:    'bg-amber-50 text-amber-700 border-amber-200',
  online:     'bg-violet-50 text-violet-700 border-violet-200',
  allocation: 'bg-teal-50 text-teal-700 border-teal-200',
  reversal:   'bg-blue-50 text-blue-700 border-blue-200',
  settlement: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const CN_STATUS_COLOR: Record<string, string> = {
  applied:  'bg-emerald-100 text-emerald-700',
  issued:   'bg-amber-100 text-amber-700',
  pending:  'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  expired:  'bg-muted text-muted-foreground',
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
  const keys = Object.keys(rows[0]).filter(k => !Array.isArray(rows[0][k]) && typeof rows[0][k] !== 'object');
  const csv  = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function LedgerPage() {
  const { token } = useAuth();
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<EntryFilter>('all');
  const [tab, setTab]           = useState<'ledger' | 'notes'>('ledger');
  const [range, setRange]       = useState<DateRange>('all');
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

  // All dynamic — straight from API data, no hardcoded numbers
  const { filteredLedger, dynDebits, dynCredits, dynNet } = useMemo(() => {
    if (!data) return { filteredLedger: [], dynDebits: 0, dynCredits: 0, dynNet: 0 };
    const dated = filterByDate(data.ledger, 'date', range, customFrom, customTo);
    const byType = filter === 'all' ? dated : dated.filter((e: any) => e.entryType === filter);
    const deb = dated.filter((e: any) => e.entryType === 'debit'  && e.status === 'posted').reduce((s: number, e: any) => s + e.amount, 0);
    const crd = dated.filter((e: any) => e.entryType === 'credit' && e.status === 'posted').reduce((s: number, e: any) => s + e.amount, 0);
    return { filteredLedger: byType, dynDebits: deb, dynCredits: crd, dynNet: crd - deb };
  }, [data, range, customFrom, customTo, filter]);

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_,i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>;
  if (!data) return null;

  const { creditNotes, summary } = data;
  const nonMasterNotes = creditNotes.filter((cn: any) => !cn.isMaster);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Main Ledger System</h1>
          <p className="text-muted-foreground text-sm mt-1">All ledger entries, credit notes and master credit note</p>
        </div>
        <button
          onClick={() => exportCSV(tab === 'ledger' ? filteredLedger : nonMasterNotes, `ledger-${tab}.csv`)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* ── Date filter ─────────────────────────────────────────────────── */}
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

      {/* ── Dynamic summary — computed from filtered real data ─────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Debits',  value: `₹${dynDebits.toLocaleString()}`,           color: 'text-red-600',     bg: 'bg-red-50 border-red-200'        },
          { label: 'Total Credits', value: `₹${dynCredits.toLocaleString()}`,           color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Net Ledger',    value: `₹${Math.abs(dynNet).toLocaleString()}`,     color: dynNet >= 0 ? 'text-emerald-600' : 'text-red-600', bg: 'bg-muted border-border' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-4 ${bg} text-center`}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">from {filteredLedger.length} entries</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-muted p-1 rounded-2xl w-fit">
        <button onClick={() => setTab('ledger')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition
            ${tab === 'ledger' ? 'bg-white shadow text-foreground' : 'text-muted-foreground'}`}>
          <BookOpen size={14} /> Ledger Entries
          <span className="px-1.5 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-bold">{filteredLedger.length}</span>
        </button>
        <button onClick={() => setTab('notes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition
            ${tab === 'notes' ? 'bg-white shadow text-foreground' : 'text-muted-foreground'}`}>
          <FileText size={14} /> Credit Notes
          <span className="px-1.5 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700 font-bold">{creditNotes.length}</span>
        </button>
      </div>

      {/* ── Ledger entries tab ────────────────────────────────────────── */}
      {tab === 'ledger' && (
        <div className="bg-card rounded-2xl border border-border">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground">Main Ledger Entry System</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{filteredLedger.length} entries — debits/credits computed from posted entries only</p>
            </div>
            <div className="flex gap-1 bg-muted p-1 rounded-xl">
              {(['all','debit','credit'] as EntryFilter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize
                    ${filter === f ? 'bg-white shadow text-foreground' : 'text-muted-foreground'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border">
            {filteredLedger.length === 0 ? (
              <p className="text-center py-10 text-sm text-muted-foreground">No entries in selected range</p>
            ) : filteredLedger.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                    ${e.entryType === 'credit' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {e.entryType === 'credit'
                      ? <ArrowDownLeft size={16} className="text-emerald-600" />
                      : <ArrowUpRight  size={16} className="text-red-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.description}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-md border ${SOURCE_COLOR[e.source] ?? 'bg-muted border-border text-muted-foreground'}`}>{e.source}</span>
                      {e.creditNoteRef      && <span className="text-xs bg-teal-50 border border-teal-200 text-teal-700 px-1.5 py-0.5 rounded-md">{e.creditNoteRef}</span>}
                      {e.masterCreditNoteRef && <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded-md font-mono">{e.masterCreditNoteRef}</span>}
                      <span className="text-xs text-muted-foreground">{e.date} · {e.postedBy}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4 text-right">
                  <p className={`text-sm font-bold ${e.entryType === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {e.entryType === 'credit' ? '+' : '-'}₹{e.amount.toLocaleString()}
                  </p>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full
                    ${e.status === 'posted' ? 'text-emerald-600' : e.status === 'pending' ? 'text-amber-600' : 'text-blue-600'}`}>
                    {e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Credit notes tab ──────────────────────────────────────────── */}
      {tab === 'notes' && (
        <div className="space-y-3">
          {/* Master Credit Note */}
          {creditNotes.filter((cn: any) => cn.isMaster).map((cn: any) => (
            <div key={cn.id} className="rounded-2xl border-2 border-indigo-300 bg-indigo-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Database size={22} className="text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-indigo-700">{cn.noteRef}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800">MASTER</span>
                      <span className="text-xs text-indigo-500">Initial capital — not counted in spend totals</span>
                    </div>
                    <p className="text-xs text-indigo-600 mt-0.5">{cn.description}</p>
                    <p className="text-xs text-indigo-500 mt-1">{cn.date} · Issued by {cn.issuedBy}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-indigo-700">₹{cn.amount.toLocaleString()}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CN_STATUS_COLOR[cn.status] ?? 'bg-muted text-muted-foreground'}`}>{cn.status}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Non-master credit notes */}
          <div className="bg-muted/40 rounded-xl px-4 py-2.5 text-xs text-muted-foreground flex items-center justify-between">
            <span>Non-master credit note total (transaction-level acknowledgements)</span>
            <span className="font-bold text-foreground">₹{summary.totalCreditNotes.toLocaleString()}</span>
          </div>

          <div className="bg-card rounded-2xl border border-border">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold text-foreground">Transaction Credit Notes</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Issued per payment gateway transaction. Total must not exceed ₹{summary.allocatedAmount?.toLocaleString() ?? '35,000'}.</p>
            </div>
            <div className="divide-y divide-border">
              {nonMasterNotes.length === 0 ? (
                <p className="text-center py-10 text-sm text-muted-foreground">No transaction credit notes</p>
              ) : nonMasterNotes.map((cn: any) => (
                <div key={cn.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={16} className="text-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{cn.noteRef}</p>
                      <p className="text-xs text-muted-foreground truncate">{cn.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cn.date} · {cn.issuedBy}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-teal-600">₹{cn.amount.toLocaleString()}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CN_STATUS_COLOR[cn.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {cn.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
