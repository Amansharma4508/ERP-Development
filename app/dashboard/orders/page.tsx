'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle, X, Plus, Clock, Truck, PackageCheck, Ban } from 'lucide-react';

interface OrderItem{itemId:string;itemName:string;quantity:number;unitPrice:number;}
interface Order{
  id:string;orderId:string;supplierName:string;items:OrderItem[];
  status:'pending'|'confirmed'|'shipped'|'delivered'|'cancelled';
  totalAmount:number;orderDate:string;deliveryDate?:string;
}

const STATUS_STYLE:Record<string,string>={
  pending:'badge-pending',confirmed:'badge-confirmed',
  shipped:'badge-shipped',delivered:'badge-delivered',cancelled:'badge-cancelled',
};
const STATUS_FLOW:Record<string,string>={pending:'confirmed',confirmed:'shipped',shipped:'delivered'};

export default function OrdersPage(){
  const {token}=useAuth();
  const [orders,setOrders]=useState<Order[]>([]);
  const [loading,setLoading]=useState(true);
  const [statusFilter,setStatusFilter]=useState('all');
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({supplierName:'',itemName:'',quantity:'',unitPrice:''});
  const [saving,setSaving]=useState(false);
  const [formError,setFormError]=useState('');
  const [actionLoading,setActionLoading]=useState<string|null>(null);
  const [toast,setToast]=useState<{msg:string;type:'success'|'error'}|null>(null);
  const [expandedId,setExpandedId]=useState<string|null>(null);

  const showToast=(msg:string,type:'success'|'error'='success')=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};

  const fetchOrders=useCallback(async()=>{
    if(!token) return;
    const res=await fetch('/api/orders',{headers:{Authorization:`Bearer ${token}`}});
    const data=await res.json();
    if(data.success) setOrders(data.data);
    setLoading(false);
  },[token]);

  useEffect(()=>{fetchOrders();},[fetchOrders]);

  const handleCreate=async(e:React.FormEvent)=>{
    e.preventDefault();setFormError('');setSaving(true);
    try{
      const res=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({supplierName:form.supplierName,items:[{itemId:`item${Date.now()}`,itemName:form.itemName,quantity:Number(form.quantity),unitPrice:Number(form.unitPrice)}]})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||'Create failed');
      setOrders(prev=>[...prev,data.data]);setShowAdd(false);setForm({supplierName:'',itemName:'',quantity:'',unitPrice:''});
      showToast('Order created.');
    }catch(err:any){setFormError(err.message);}
    finally{setSaving(false);}
  };

  const handleAdvance=async(order:Order)=>{
    const nextStatus=STATUS_FLOW[order.status];if(!nextStatus)return;
    setActionLoading(order.id);
    try{
      const res=await fetch(`/api/orders/${order.id}`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({status:nextStatus})});
      const data=await res.json();if(!res.ok) throw new Error(data.error);
      setOrders(prev=>prev.map(o=>o.id===order.id?data.data:o));showToast(`Order advanced to "${nextStatus}".`);
    }catch(err:any){showToast(err.message,'error');}
    finally{setActionLoading(null);}
  };

  const handleCancel=async(id:string)=>{
    setActionLoading(id);
    try{
      const res=await fetch(`/api/orders/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({status:'cancelled'})});
      const data=await res.json();if(!res.ok) throw new Error(data.error);
      setOrders(prev=>prev.map(o=>o.id===id?data.data:o));showToast('Order cancelled.');
    }catch(err:any){showToast(err.message,'error');}
    finally{setActionLoading(null);}
  };

  const filtered=statusFilter==='all'?orders:orders.filter(o=>o.status===statusFilter);
  const tabs=['all','pending','confirmed','shipped','delivered','cancelled'];

  const StatusIcon:Record<string,React.ReactNode>={
    pending:<Clock size={14}/>,confirmed:<CheckCircle size={14}/>,
    shipped:<Truck size={14}/>,delivered:<PackageCheck size={14}/>,cancelled:<Ban size={14}/>,
  };

  return(
    <div className="space-y-6">
      {toast&&(
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in-up flex items-center gap-2 ${toast.type==='success'?'bg-emerald-500':'bg-red-500'}`}>
          {toast.type==='success'?<CheckCircle size={16}/>:<XCircle size={16}/>} {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage supplier orders and track deliveries</p>
        </div>
        <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow transition hover:opacity-90" style={{background:'linear-gradient(135deg,#0891b2,#06b6d4)'}}>
          <Plus size={18}/> New Order
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {['pending','confirmed','shipped','delivered','cancelled'].map(s=>(
          <div key={s} className={`rounded-xl p-3 text-center border cursor-pointer transition ${statusFilter===s?'border-indigo-400 bg-indigo-50':'bg-card border-border hover:border-indigo-200'}`}
            onClick={()=>setStatusFilter(statusFilter===s?'all':s)}>
            <p className="text-xl font-bold text-foreground">{orders.filter(o=>o.status===s).length}</p>
            <p className="text-xs text-muted-foreground capitalize">{s}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 flex-wrap">
        {tabs.map(t=>(
          <button key={t} onClick={()=>setStatusFilter(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition capitalize
              ${statusFilter===t?'bg-indigo-600 text-white border-indigo-600':'bg-card border-border text-muted-foreground hover:border-indigo-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading?(
        <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="skeleton h-20 rounded-2xl"/>)}</div>
      ):filtered.length===0?(
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-20"/>
          <p className="font-semibold text-foreground">No orders found</p>
        </div>
      ):(
        <div className="space-y-3">
          {filtered.map(order=>(
            <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-cyan-200 transition">
              <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={()=>setExpandedId(expandedId===order.id?null:order.id)}>
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart size={18} className="text-cyan-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{order.orderId}</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${STATUS_STYLE[order.status]}`}>
                      {StatusIcon[order.status]} {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.supplierName} · {order.items.length} item(s)</p>
                  <p className="text-xs text-muted-foreground">Ordered: {order.orderDate}{order.deliveryDate?` · Delivery: ${order.deliveryDate}`:''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-foreground">${order.totalAmount.toFixed(2)}</p>
                  {expandedId===order.id?<ChevronUp size={14} className="ml-auto text-muted-foreground"/>:<ChevronDown size={14} className="ml-auto text-muted-foreground"/>}
                </div>
              </div>
              {expandedId===order.id&&(
                <div className="border-t border-border p-5 bg-muted">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Order Items</h4>
                  <div className="space-y-2 mb-4">
                    {order.items.map((item,idx)=>(
                      <div key={idx} className="flex items-center justify-between text-sm bg-card rounded-xl px-4 py-2.5 border border-border">
                        <span className="text-foreground font-medium">{item.itemName}</span>
                        <span className="text-muted-foreground">×{item.quantity} @ ${item.unitPrice}</span>
                        <span className="font-bold text-foreground">${(item.quantity*item.unitPrice).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_FLOW[order.status]&&(
                      <button onClick={()=>handleAdvance(order)} disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition disabled:opacity-50 capitalize">
                        {actionLoading===order.id?<Clock size={14}/>:<Truck size={14}/>} Mark as {STATUS_FLOW[order.status]}
                      </button>
                    )}
                    {(order.status==='pending'||order.status==='confirmed')&&(
                      <button onClick={()=>handleCancel(order.id)} disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-50">
                        <Ban size={14}/> Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Create Order</h2>
              <button onClick={()=>{setShowAdd(false);setFormError('');}} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition"><X size={16}/></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError&&<div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"><AlertCircle size={15}/> {formError}</div>}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Supplier Name</label>
                <input value={form.supplierName} onChange={e=>setForm({...form,supplierName:e.target.value})} required placeholder="PharmaCo"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Item Name</label>
                <input value={form.itemName} onChange={e=>setForm({...form,itemName:e.target.value})} required placeholder="Paracetamol 500mg"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Quantity</label>
                  <input type="number" min="1" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} required
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Unit Price ($)</label>
                  <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={e=>setForm({...form,unitPrice:e.target.value})} required
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
              </div>
              {form.quantity&&form.unitPrice&&(
                <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-sm">
                  <p className="text-cyan-800 font-medium">Order Total: <span className="font-bold">${(Number(form.quantity)*Number(form.unitPrice)).toFixed(2)}</span></p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowAdd(false);setFormError('');}} className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-white font-semibold transition text-sm" style={{background:saving?'#67e8f9':'linear-gradient(135deg,#0891b2,#06b6d4)'}}>
                  {saving?'Creating…':'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
