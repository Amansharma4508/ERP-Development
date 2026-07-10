'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, AlertTriangle, Pencil, Trash2, CheckCircle, XCircle, AlertCircle, X, Package } from 'lucide-react';

interface InventoryItem {
  id:string; name:string; sku:string; category:string;
  quantity:number; reorderLevel:number; unitCost:number; supplier:string; lastUpdated:string;
}

const CATEGORIES=['All','Medicine','Supplies','Equipment'];

export default function InventoryPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem|null>(null);
  const [form, setForm] = useState({name:'',sku:'',category:'Medicine',quantity:'',reorderLevel:'10',unitCost:'',supplier:''});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);

  const showToast=(msg:string,type:'success'|'error'='success')=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};

  const fetchItems=useCallback(async()=>{
    if(!token) return;
    const res=await fetch('/api/inventory',{headers:{Authorization:`Bearer ${token}`}});
    const data=await res.json();
    if(data.success) setItems(data.data);
    setLoading(false);
  },[token]);

  useEffect(()=>{fetchItems();},[fetchItems]);

  const openAdd=()=>{setEditItem(null);setForm({name:'',sku:'',category:'Medicine',quantity:'',reorderLevel:'10',unitCost:'',supplier:''});setFormError('');setShowAdd(true);};
  const openEdit=(item:InventoryItem)=>{setEditItem(item);setForm({name:item.name,sku:item.sku,category:item.category,quantity:String(item.quantity),reorderLevel:String(item.reorderLevel),unitCost:String(item.unitCost),supplier:item.supplier});setFormError('');setShowAdd(true);};

  const handleSave=async(e:React.FormEvent)=>{
    e.preventDefault();setFormError('');setSaving(true);
    try{
      const url=editItem?`/api/inventory/${editItem.id}`:'/api/inventory';
      const res=await fetch(url,{method:editItem?'PATCH':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({...form,quantity:Number(form.quantity),reorderLevel:Number(form.reorderLevel),unitCost:Number(form.unitCost)})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||'Save failed');
      if(editItem){setItems(prev=>prev.map(i=>i.id===editItem.id?data.data:i));showToast('Item updated.');}
      else{setItems(prev=>[...prev,data.data]);showToast('Item added.');}
      setShowAdd(false);
    }catch(err:any){setFormError(err.message);}
    finally{setSaving(false);}
  };

  const handleDelete=async(id:string)=>{
    setDeleteId(id);
    try{
      const res=await fetch(`/api/inventory/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error);
      setItems(prev=>prev.filter(i=>i.id!==id));showToast('Item removed.');
    }catch(err:any){showToast(err.message,'error');}
    finally{setDeleteId(null);}
  };

  const filtered=items.filter(i=>{
    const matchSearch=i.name.toLowerCase().includes(search.toLowerCase())||i.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat=catFilter==='All'||i.category===catFilter;
    const matchLow=!lowStockOnly||i.quantity<=i.reorderLevel;
    return matchSearch&&matchCat&&matchLow;
  });

  const lowStockCount=items.filter(i=>i.quantity<=i.reorderLevel).length;
  const totalValue=items.reduce((s,i)=>s+i.quantity*i.unitCost,0);

  return (
    <div className="space-y-6">
      {toast&&(
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in-up flex items-center gap-2 ${toast.type==='success'?'bg-emerald-500':'bg-red-500'}`}>
          {toast.type==='success'?<CheckCircle size={16}/>:<XCircle size={16}/>} {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">Track stock levels and manage supplies</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow transition hover:opacity-90" style={{background:'linear-gradient(135deg,#d97706,#f59e0b)'}}>
          <Plus size={18}/> Add Item
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
          <Package size={22} className="text-indigo-500"/>
          <div><p className="text-2xl font-bold text-foreground">{items.length}</p><p className="text-xs text-muted-foreground">Total Items</p></div>
        </div>
        <div className={`rounded-2xl border p-4 flex items-center gap-3 ${lowStockCount>0?'bg-red-50 border-red-200':'bg-card border-border'}`}>
          <AlertTriangle size={22} className={lowStockCount>0?'text-red-500':'text-muted-foreground'}/>
          <div><p className={`text-2xl font-bold ${lowStockCount>0?'text-red-600':'text-foreground'}`}>{lowStockCount}</p><p className={`text-xs ${lowStockCount>0?'text-red-500':'text-muted-foreground'}`}>Low Stock</p></div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-2xl font-bold text-foreground">${totalValue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Value</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-2xl font-bold text-foreground">{new Set(items.map(i=>i.category)).size}</p>
          <p className="text-xs text-muted-foreground mt-1">Categories</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or SKU…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${catFilter===c?'bg-white shadow text-foreground':'text-muted-foreground'}`}>{c}</button>
          ))}
        </div>
        <button onClick={()=>setLowStockOnly(!lowStockOnly)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition
            ${lowStockOnly?'bg-red-500 text-white border-red-500':'bg-card border-border text-muted-foreground hover:border-red-300'}`}>
          <AlertTriangle size={14}/> Low Stock
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-14 rounded-xl"/>)}</div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  {['Item','SKU','Category','Qty','Unit Cost','Supplier','Actions'].map(h=>(
                    <th key={h} className={`px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${h==='Qty'||h==='Unit Cost'?'text-right':'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length===0?(
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No items found</td></tr>
                ):filtered.map(item=>{
                  const isLow=item.quantity<=item.reorderLevel;
                  return (
                    <tr key={item.id} className="hover:bg-muted transition">
                      <td className="px-5 py-3">
                        <p className="font-medium text-foreground">{item.name}</p>
                        {isLow&&<span className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertTriangle size={10}/>Low stock</span>}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{item.sku}</td>
                      <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-lg bg-muted text-muted-foreground text-xs border border-border">{item.category}</span></td>
                      <td className="px-5 py-3 text-right">
                        <span className={`font-bold text-sm ${isLow?'text-red-600':'text-foreground'}`}>{item.quantity}</span>
                        <span className="text-xs text-muted-foreground ml-1">/ {item.reorderLevel} min</span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-foreground">${item.unitCost}</td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">{item.supplier}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={()=>openEdit(item)} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"><Pencil size={13}/></button>
                          <button onClick={()=>handleDelete(item.id)} disabled={deleteId===item.id} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">{editItem?'Edit Item':'Add Inventory Item'}</h2>
              <button onClick={()=>setShowAdd(false)} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition"><X size={16}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError&&<div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"><AlertCircle size={15}/> {formError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Item Name</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="Paracetamol 500mg"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">SKU</label>
                  <input value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} required placeholder="MED-001"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {['Medicine','Supplies','Equipment'].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {[{label:'Quantity',field:'quantity',min:'0'},{label:'Reorder Level',field:'reorderLevel',min:'0'},{label:'Unit Cost ($)',field:'unitCost',min:'0',step:'0.01'}].map(f=>(
                  <div key={f.field}>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                    <input type="number" min={f.min} step={f.step} value={(form as any)[f.field]} onChange={e=>setForm({...form,[f.field]:e.target.value})} required={f.field!=='reorderLevel'}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Supplier</label>
                  <input value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})} placeholder="Supplier name"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-white font-semibold transition text-sm" style={{background:saving?'#fcd34d':'linear-gradient(135deg,#d97706,#f59e0b)'}}>
                  {saving?'Saving…':editItem?'Save Changes':'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
