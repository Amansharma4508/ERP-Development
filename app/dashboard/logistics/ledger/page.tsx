'use client';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { ReceiptText, TrendingUp, TrendingDown, Plus, X, AlertCircle, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface LedgerEntry {
  id: string; type: 'debit'|'credit'; category: string;
  amount: number; description: string; reference: string; date: string;
}

const DEBIT_CATS  = ['supplier','freight','maintenance','salary','utilities','other'];
const CREDIT_CATS = ['center','customer','refund','insurance','other'];
const CAT_COLOR: Record<string,string> = {
  supplier:'bg-red-50 text-red-700', freight:'bg-orange-50 text-orange-700',
  center:'bg-emerald-50 text-emerald-700', customer:'bg-blue-50 text-blue-700',
  refund:'bg-violet-50 text-violet-700', maintenance:'bg-amber-50 text-amber-700',
};

export default function LedgerPage() {
  const { token } = useAuth();
  const [entries, setEntries]         = useState<LedgerEntry[]>([]);
  const [totalDebits, setTotalDebits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [net, setNet]                 = useState(0);
  const [loading, setLoading]         = useState(true);
  const [typeFilter, setTypeFilter]   = useState<'all'|'debit'|'credit'>('all');
  const [showAdd, setShowAdd]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState('');
  const [deleteId, setDeleteId]       = useState<string|null>(null);
  const [toast, setToast]             = useState<{msg:string;type:'success'|'error'}|null>(null);
  const [form, setForm] = useState({ type:'debit', category:'supplier', amount:'', description:'', reference:'', date:'' });

  const showToast = (msg:string,type:'success'|'error'='success') => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  };

  const fetchLedger = useCallback(async () => {
    if (!token) return;
    const res  = await fetch('/api/logistics/ledger',{headers:{Authorization:`Bearer ${token}`}});
    const data = await res.json();
    if (data.success) { setEntries(data.data.entries); setTotalDebits(data.data.totalDebits); setTotalCredits(data.data.totalCredits); setNet(data.data.net); }
    setLoading(false);
  },[token]);

  useEffect(()=>{fetchLedger();},[fetchLedger]);

  const handleSave = async (e:React.FormEvent) => {
    e.preventDefault(); setFormError(''); setSaving(true);
    try {
      const res  = await fetch('/api/logistics/ledger',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({...form,amount:Number(form.amount)})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Save failed');
      setEntries(prev=>[data.data,...prev]);
      if (data.data.type==='debit') { setTotalDebits(p=>p+data.data.amount); setNet(p=>p-data.data.amount); }
      else { setTotalCredits(p=>p+data.data.amount); setNet(p=>p+data.data.amount); }
      setShowAdd(false); setForm({type:'debit',category:'supplier',amount:'',description:'',reference:'',date:''});
      showToast('Transaction recorded.');
    } catch(err:any){setFormError(err.message);}
    finally{setSaving(false);}
  };

  const filtered = typeFilter==='all' ? entries : entries.filter(e=>e.type===typeFilter);
  const cats = form.type==='debit' ? DEBIT_CATS : CREDIT_CATS;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in-up flex items-center gap-2 ${toast.type==='success'?'bg-emerald-500':'bg-red-500'}`}>
          {toast.type==='success'?<CheckCircle size={16}/>:<XCircle size={16}/>} {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funds Ledger</h1>
          <p className="text-muted-foreground text-sm mt-1">Debits (suppliers, freight) and Credits (centers, customers)</p>
        </div>
        <button onClick={()=>setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow hover:opacity-90 transition"
          style={{background:'linear-gradient(135deg,#059669,#10b981)'}}>
          <Plus size={18}/> Add Entry
        </button>
      </div>

      {loading ? (
        <div className="space-y-4"><div className="skeleton h-28 rounded-2xl"/><div className="skeleton h-64 rounded-2xl"/></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl p-6 text-white shadow-lg stat-emerald">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-2"><TrendingUp size={16}/> Total Credits</div>
              <p className="text-3xl font-bold">₹{totalCredits.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl p-6 text-white shadow-lg stat-rose">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-2"><TrendingDown size={16}/> Total Debits</div>
              <p className="text-3xl font-bold">₹{totalDebits.toLocaleString()}</p>
            </div>
            <div className={`rounded-2xl p-6 text-white shadow-lg ${net>=0?'stat-cyan':'stat-rose'}`}>
              <div className="flex items-center gap-2 text-white/70 text-sm mb-2"><ReceiptText size={16}/> Net Balance</div>
              <p className="text-3xl font-bold">{net>=0?'+':''}₹{net.toLocaleString()}</p>
              <p className="text-white/60 text-xs mt-1">{net>=0?'Surplus':'Deficit'}</p>
            </div>
          </div>

          {/* Ratio bar */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Debit / Credit Ratio</span>
              <span className="text-sm text-muted-foreground">{totalCredits>0?Math.round((totalDebits/totalCredits)*100):0}% debit ratio</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{width:totalCredits+totalDebits>0?`${(totalCredits/(totalCredits+totalDebits))*100}%`:'50%'}}/>
              <div className="h-full bg-red-400 flex-1"/>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Credits</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Debits</span>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold text-foreground">Transactions ({filtered.length})</h3>
              <div className="flex gap-1 bg-muted p-1 rounded-xl">
                {(['all','credit','debit'] as const).map(f=>(
                  <button key={f} onClick={()=>setTypeFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${typeFilter===f?'bg-white shadow text-foreground':'text-muted-foreground'}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    {['Date','Description','Category','Reference','Amount'].map(h=>(
                      <th key={h} className={`px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${h==='Amount'?'text-right':'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length===0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No entries</td></tr>
                  ) : filtered.map(e=>(
                    <tr key={e.id} className="hover:bg-muted transition">
                      <td className="px-5 py-3 text-muted-foreground text-xs">{e.date}</td>
                      <td className="px-5 py-3 font-medium text-foreground">{e.description}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border-0 capitalize ${CAT_COLOR[e.category]||'bg-gray-100 text-gray-700'}`}>{e.category}</span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{e.reference||'—'}</td>
                      <td className={`px-5 py-3 text-right font-bold flex items-center justify-end gap-1 ${e.type==='credit'?'text-emerald-600':'text-red-600'}`}>
                        {e.type==='credit'?<TrendingUp size={13}/>:<TrendingDown size={13}/>}
                        {e.type==='credit'?'+':'-'}₹{e.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {filtered.length>0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted">
                      <td colSpan={4} className="px-5 py-3 text-sm font-semibold text-foreground">Total</td>
                      <td className="px-5 py-3 text-right font-bold text-foreground">₹{filtered.reduce((s,e)=>s+e.amount,0).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Add Ledger Entry</h2>
              <button onClick={()=>{setShowAdd(false);setFormError('');}} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition"><X size={16}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError&&<div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"><AlertCircle size={15}/>{formError}</div>}
              <div className="flex gap-2">
                {(['debit','credit'] as const).map(t=>(
                  <button type="button" key={t} onClick={()=>setForm({...form,type:t,category:t==='debit'?DEBIT_CATS[0]:CREDIT_CATS[0]})}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition flex items-center justify-center gap-2 capitalize
                      ${form.type===t ? t==='debit'?'border-red-400 bg-red-50 text-red-700':'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-border text-muted-foreground'}`}>
                    {t==='debit'?<TrendingDown size={14}/>:<TrendingUp size={14}/>} {t}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring capitalize">
                    {cats.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Amount (₹)</label>
                  <input type="number" min="1" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Reference</label>
                  <input value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} placeholder="INV-001 (optional)"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                  <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required placeholder="Describe this transaction"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowAdd(false);setFormError('');}} className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-white font-semibold transition text-sm disabled:opacity-50" style={{background:saving?'#6ee7b7':'linear-gradient(135deg,#059669,#10b981)'}}>
                  {saving?'Saving…':'Record Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
