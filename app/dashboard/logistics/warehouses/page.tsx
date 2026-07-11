'use client';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { Warehouse, Plus, X, AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface StockItem { itemName: string; sku: string; quantity: number; unit: string; lastUpdated: string; }
interface WarehouseData {
  id: string; name: string; pointId: string; area: string; block: string;
  district: string; zone: string; totalCapacity: number; usedCapacity: number;
  managerName: string; phone: string; stock: StockItem[];
}

export default function WarehousesPage() {
  const { token } = useAuth();
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showStock, setShowStock]   = useState(false);
  const [stockWh, setStockWh]       = useState<string>('');
  const [stockAction, setStockAction] = useState<'add'|'remove'>('add');
  const [stockForm, setStockForm]   = useState({ itemName:'', sku:'', quantity:'', unit:'units' });
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');
  const [toast, setToast]           = useState<{msg:string;type:'success'|'error'}|null>(null);

  const showToast = (msg:string,type:'success'|'error'='success') => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  };

  const fetchWarehouses = useCallback(async () => {
    if (!token) return;
    const res  = await fetch('/api/logistics/warehouses',{headers:{Authorization:`Bearer ${token}`}});
    const data = await res.json();
    if (data.success) setWarehouses(data.data);
    setLoading(false);
  },[token]);

  useEffect(()=>{fetchWarehouses();},[fetchWarehouses]);

  const openStock = (id:string, action:'add'|'remove') => {
    setStockWh(id); setStockAction(action);
    setStockForm({itemName:'',sku:'',quantity:'',unit:'units'});
    setFormError(''); setShowStock(true);
  };

  const handleStock = async (e:React.FormEvent) => {
    e.preventDefault(); setFormError(''); setSaving(true);
    try {
      const res  = await fetch('/api/logistics/warehouses',{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({warehouseId:stockWh,action:stockAction,...stockForm,quantity:Number(stockForm.quantity)}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Failed');
      setWarehouses(prev=>prev.map(w=>w.id===stockWh?data.data:w));
      setShowStock(false); showToast(`Stock ${stockAction==='add'?'added':'removed'} successfully.`);
    } catch(err:any){setFormError(err.message);}
    finally{setSaving(false);}
  };

  const totalStock = (w:WarehouseData) => w.stock.reduce((s,i)=>s+i.quantity,0);

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in-up flex items-center gap-2 ${toast.type==='success'?'bg-emerald-500':'bg-red-500'}`}>
          {toast.type==='success'?<CheckCircle size={16}/>:<XCircle size={16}/>} {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground">Warehouses</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor stock levels across all distribution points</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:'Total Warehouses',value:warehouses.length,cls:'bg-card border-border'},
          {label:'Total SKUs',value:warehouses.reduce((s,w)=>s+w.stock.length,0),cls:'bg-cyan-50 border-cyan-200'},
          {label:'Total Items',value:warehouses.reduce((s,w)=>s+totalStock(w),0),cls:'bg-amber-50 border-amber-200'},
          {label:'High Utilization',value:warehouses.filter(w=>w.usedCapacity/w.totalCapacity>0.8).length,cls:'bg-red-50 border-red-200'},
        ].map(s=>(
          <div key={s.label} className={`rounded-2xl border p-4 ${s.cls}`}>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i)=><div key={i} className="skeleton h-32 rounded-2xl"/>)}</div>
      ) : (
        <div className="space-y-4">
          {warehouses.map(w=>{
            const pct = Math.round((w.usedCapacity/w.totalCapacity)*100);
            return (
              <div key={w.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-cyan-200 transition">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{background:'linear-gradient(135deg,#e0f2fe,#bae6fd)'}}>
                        <Warehouse size={22} className="text-cyan-600"/>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground">{w.name}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{w.pointId}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{w.area} · {w.block} · {w.district} · {w.zone}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Manager: {w.managerName} · {w.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={()=>openStock(w.id,'add')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition">
                        <Plus size={13}/> Stock In
                      </button>
                      <button onClick={()=>openStock(w.id,'remove')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition">
                        Stock Out
                      </button>
                      <button onClick={()=>setExpandedId(expandedId===w.id?null:w.id)}
                        className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted transition">
                        {expandedId===w.id?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                      </button>
                    </div>
                  </div>

                  {/* Utilization bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">Capacity: {w.usedCapacity.toLocaleString()} / {w.totalCapacity.toLocaleString()} units</span>
                      <span className={`text-xs font-bold ${pct>85?'text-red-600':pct>60?'text-amber-600':'text-emerald-600'}`}>{pct}% used</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct>85?'bg-red-500':pct>60?'bg-amber-500':'bg-emerald-500'}`} style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                </div>

                {/* Stock table */}
                {expandedId===w.id && (
                  <div className="border-t border-border bg-muted p-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Current Stock ({w.stock.length} items)</p>
                    {w.stock.length===0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No stock recorded</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              {['Item','SKU','Quantity','Unit','Last Updated'].map(h=>(
                                <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {w.stock.map(item=>(
                              <tr key={item.sku} className="bg-card hover:bg-muted/50 transition">
                                <td className="px-4 py-2.5 font-medium text-foreground">{item.itemName}</td>
                                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{item.sku}</td>
                                <td className={`px-4 py-2.5 font-bold ${item.quantity<10?'text-red-600':item.quantity<50?'text-amber-600':'text-foreground'}`}>{item.quantity}</td>
                                <td className="px-4 py-2.5 text-muted-foreground">{item.unit}</td>
                                <td className="px-4 py-2.5 text-muted-foreground text-xs">{item.lastUpdated}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">{stockAction==='add'?'Stock In':'Stock Out'}</h2>
              <button onClick={()=>setShowStock(false)} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition"><X size={16}/></button>
            </div>
            <form onSubmit={handleStock} className="p-6 space-y-4">
              {formError&&<div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"><AlertCircle size={15}/>{formError}</div>}
              {stockAction==='add' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Item Name</label>
                  <input value={stockForm.itemName} onChange={e=>setStockForm({...stockForm,itemName:e.target.value})} required
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Paracetamol 500mg"/>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">SKU</label>
                <input value={stockForm.sku} onChange={e=>setStockForm({...stockForm,sku:e.target.value})} required
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="MED-001"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Quantity</label>
                  <input type="number" min="1" value={stockForm.quantity} onChange={e=>setStockForm({...stockForm,quantity:e.target.value})} required
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Unit</label>
                  <select value={stockForm.unit} onChange={e=>setStockForm({...stockForm,unit:e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {['units','boxes','strips','pcs','kits'].map(u=><option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowStock(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className={`flex-1 py-2.5 rounded-xl text-white font-semibold transition text-sm ${stockAction==='add'?'bg-emerald-500 hover:bg-emerald-600':'bg-red-500 hover:bg-red-600'} disabled:opacity-50`}>
                  {saving?'Processing…':stockAction==='add'?'Add Stock':'Remove Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
