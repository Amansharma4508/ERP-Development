'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface AccountingTxn{
  id:string;transactionId:string;type:'income'|'expense';
  category:string;amount:number;description:string;date:string;reference?:string;
}

const INCOME_CATEGORIES=['Consultation','Lab Services','Insurance','Other Income'];
const EXPENSE_CATEGORIES=['Salary','Supplies','Equipment','Utilities','Rent','Other Expense'];

export default function AccountingPage(){
  const {token}=useAuth();
  const [transactions,setTransactions]=useState<AccountingTxn[]>([]);
  const [totalIncome,setTotalIncome]=useState(0);
  const [totalExpense,setTotalExpense]=useState(0);
  const [profit,setProfit]=useState(0);
  const [loading,setLoading]=useState(true);
  const [typeFilter,setTypeFilter]=useState<'all'|'income'|'expense'>('all');
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({type:'income',category:'Consultation',amount:'',description:'',date:'',reference:''});
  const [saving,setSaving]=useState(false);
  const [formError,setFormError]=useState('');
  const [deleteId,setDeleteId]=useState<string|null>(null);
  const [toast,setToast]=useState<{msg:string;type:'success'|'error'}|null>(null);

  const showToast=(msg:string,type:'success'|'error'='success')=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};

  const fetchData=useCallback(async()=>{
    if(!token) return;
    const res=await fetch('/api/accounting',{headers:{Authorization:`Bearer ${token}`}});
    const data=await res.json();
    if(data.success){setTransactions(data.data.transactions);setTotalIncome(data.data.totalIncome);setTotalExpense(data.data.totalExpense);setProfit(data.data.profit);}
    setLoading(false);
  },[token]);

  useEffect(()=>{fetchData();},[fetchData]);

  const handleSave=async(e:React.FormEvent)=>{
    e.preventDefault();setFormError('');setSaving(true);
    try{
      const res=await fetch('/api/accounting',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({...form,amount:Number(form.amount)})});
      const data=await res.json();if(!res.ok) throw new Error(data.error||'Save failed');
      setTransactions(prev=>[data.data,...prev]);
      if(data.data.type==='income'){setTotalIncome(p=>p+data.data.amount);setProfit(p=>p+data.data.amount);}
      else{setTotalExpense(p=>p+data.data.amount);setProfit(p=>p-data.data.amount);}
      setShowAdd(false);setForm({type:'income',category:'Consultation',amount:'',description:'',date:'',reference:''});
      showToast('Transaction recorded.');
    }catch(err:any){setFormError(err.message);}
    finally{setSaving(false);}
  };

  const handleDelete=async(txn:AccountingTxn)=>{
    setDeleteId(txn.id);
    try{
      const res=await fetch(`/api/accounting/${txn.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
      const data=await res.json();if(!res.ok) throw new Error(data.error);
      setTransactions(prev=>prev.filter(t=>t.id!==txn.id));
      if(txn.type==='income'){setTotalIncome(p=>p-txn.amount);setProfit(p=>p-txn.amount);}
      else{setTotalExpense(p=>p-txn.amount);setProfit(p=>p+txn.amount);}
      showToast('Transaction deleted.');
    }catch(err:any){showToast(err.message,'error');}
    finally{setDeleteId(null);}
  };

  const filtered=typeFilter==='all'?transactions:transactions.filter(t=>t.type===typeFilter);
  const categories=form.type==='income'?INCOME_CATEGORIES:EXPENSE_CATEGORIES;

  return(
    <div className="space-y-6">
      {toast&&(
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in-up flex items-center gap-2 ${toast.type==='success'?'bg-emerald-500':'bg-red-500'}`}>
          {toast.type==='success'?<CheckCircle size={16}/>:<XCircle size={16}/>} {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounting</h1>
          <p className="text-muted-foreground text-sm mt-1">Track income, expenses and profitability</p>
        </div>
        <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow transition hover:opacity-90" style={{background:'linear-gradient(135deg,#059669,#10b981)'}}>
          <Plus size={18}/> Add Transaction
        </button>
      </div>

      {loading?(
        <div className="space-y-4"><div className="skeleton h-32 rounded-2xl"/><div className="skeleton h-64 rounded-2xl"/></div>
      ):(
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl p-6 text-white stat-emerald shadow-lg">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-2"><TrendingUp size={16}/> Total Income</div>
              <p className="text-3xl font-bold">${totalIncome.toLocaleString()}</p>
              <p className="text-white/60 text-xs mt-2">All revenue sources</p>
            </div>
            <div className="rounded-2xl p-6 text-white stat-rose shadow-lg">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-2"><TrendingDown size={16}/> Total Expenses</div>
              <p className="text-3xl font-bold">${totalExpense.toLocaleString()}</p>
              <p className="text-white/60 text-xs mt-2">All expenditures</p>
            </div>
            <div className={`rounded-2xl p-6 text-white shadow-lg ${profit>=0?'stat-cyan':'stat-rose'}`}>
              <div className="flex items-center gap-2 text-white/70 text-sm mb-2"><DollarSign size={16}/> Net Profit</div>
              <p className="text-3xl font-bold">{profit>=0?'+':''}{profit.toLocaleString()}</p>
              <p className="text-white/60 text-xs mt-2">{profit>=0?'Profitable':'Operating at loss'}</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Income vs Expense Ratio</span>
              <span className="text-sm text-muted-foreground">{totalIncome>0?Math.round((totalExpense/totalIncome)*100):0}% expense ratio</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 relative" style={{width:totalIncome>0?`${Math.min(100,(totalIncome/(totalIncome+totalExpense))*100)}%`:'0%'}}>
                <div className="absolute inset-y-0 right-0 w-full rounded-full bg-red-400" style={{width:totalIncome>0?`${Math.min(100,(totalExpense/(totalIncome+totalExpense))*100)}%`:'0%',left:'auto'}}/>
              </div>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Income</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Expenses</span>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold text-foreground">Transactions</h3>
              <div className="flex gap-1 bg-muted p-1 rounded-xl">
                {(['all','income','expense'] as const).map(f=>(
                  <button key={f} onClick={()=>setTypeFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${typeFilter===f?'bg-white shadow text-foreground':'text-muted-foreground'}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    {['ID','Description','Category','Date','Amount','Actions'].map((h,i)=>(
                      <th key={h} className={`px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${i===4?'text-right':i===5?'text-right':'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length===0?(
                    <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No transactions found</td></tr>
                  ):filtered.map(txn=>(
                    <tr key={txn.id} className="hover:bg-muted transition">
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{txn.transactionId}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-foreground text-sm">{txn.description}</p>
                        {txn.reference&&<p className="text-xs text-muted-foreground">{txn.reference}</p>}
                      </td>
                      <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-lg bg-muted text-muted-foreground text-xs border border-border">{txn.category}</span></td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{txn.date}</td>
                      <td className={`px-5 py-3 text-right font-bold text-base flex items-center justify-end gap-1 ${txn.type==='income'?'text-emerald-600':'text-red-600'}`}>
                        {txn.type==='income'?<TrendingUp size={14}/>:<TrendingDown size={14}/>}
                        {txn.type==='income'?'+':'-'}${txn.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={()=>handleDelete(txn)} disabled={deleteId===txn.id}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                          <Trash2 size={13}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {filtered.length>0&&(
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted">
                      <td colSpan={4} className="px-5 py-3 text-sm font-semibold text-foreground">Total ({filtered.length} transactions)</td>
                      <td className="px-5 py-3 text-right font-bold text-base text-foreground">${filtered.reduce((s,t)=>s+t.amount,0).toLocaleString()}</td>
                      <td/>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {showAdd&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Add Transaction</h2>
              <button onClick={()=>{setShowAdd(false);setFormError('');}} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition"><X size={16}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError&&<div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"><AlertCircle size={15}/> {formError}</div>}
              <div className="flex gap-2">
                {(['income','expense'] as const).map(t=>(
                  <button type="button" key={t} onClick={()=>setForm({...form,type:t,category:t==='income'?INCOME_CATEGORIES[0]:EXPENSE_CATEGORIES[0]})}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition flex items-center justify-center gap-2 capitalize
                      ${form.type===t
                        ?t==='income'?'border-emerald-400 bg-emerald-50 text-emerald-700':'border-red-400 bg-red-50 text-red-700'
                        :'border-border text-muted-foreground hover:border-gray-300'}`}>
                    {t==='income'?<TrendingUp size={15}/>:<TrendingDown size={15}/>} {t}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {categories.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Amount ($)</label>
                  <input type="number" min="1" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required
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
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-white font-semibold transition text-sm" style={{background:saving?'#6ee7b7':'linear-gradient(135deg,#059669,#10b981)'}}>
                  {saving?'Saving…':'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
