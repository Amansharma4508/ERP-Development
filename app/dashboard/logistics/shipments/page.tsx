'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import {
  Truck, Plus, X, AlertCircle, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Clock, PackageCheck, Ban,
} from 'lucide-react';

interface ShipmentItem { itemName: string; quantity: number; unit: string; }
interface Shipment {
  id: string; shipmentId: string; vendorName: string; fromLocation: string;
  toLocation: string; toType: string; items: ShipmentItem[];
  status: string; carrierName: string; trackingNumber: string;
  dispatchDate: string; expectedDelivery: string; actualDelivery?: string;
  totalValue: number; createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  po_received:'badge-pending', prep:'badge-pending',
  in_transit:'badge-shipped', delivered:'badge-delivered', cancelled:'badge-cancelled',
};
const STATUS_LABEL: Record<string, string> = {
  po_received:'PO Received', prep:'Prep', in_transit:'In Transit',
  delivered:'Delivered', cancelled:'Cancelled',
};
const FLOW: Record<string, string> = {
  po_received:'prep', prep:'in_transit', in_transit:'delivered',
};
const STATUSES = ['all','po_received','prep','in_transit','delivered','cancelled'];

export default function ShipmentsPage() {
  const { token } = useAuth();
  const [shipments, setShipments]     = useState<Shipment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [formError, setFormError]     = useState('');
  const [saving, setSaving]           = useState(false);
  const [form, setForm] = useState({
    vendorName:'', fromLocation:'', toLocation:'', toType:'center',
    carrierName:'', dispatchDate:'', expectedDelivery:'', totalValue:'',
    itemName:'', quantity:'', unit:'units',
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const fetchShipments = useCallback(async () => {
    if (!token) return;
    const res  = await fetch('/api/logistics/shipments', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setShipments(data.data);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(''); setSaving(true);
    try {
      const res = await fetch('/api/logistics/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          vendorName: form.vendorName, fromLocation: form.fromLocation,
          toLocation: form.toLocation, toType: form.toType,
          carrierName: form.carrierName, dispatchDate: form.dispatchDate,
          expectedDelivery: form.expectedDelivery, totalValue: Number(form.totalValue),
          items: [{ itemName: form.itemName, quantity: Number(form.quantity), unit: form.unit }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setShipments(prev => [data.data, ...prev]);
      setShowAdd(false);
      setForm({ vendorName:'', fromLocation:'', toLocation:'', toType:'center', carrierName:'', dispatchDate:'', expectedDelivery:'', totalValue:'', itemName:'', quantity:'', unit:'units' });
      showToast('Shipment created successfully.');
    } catch (err: any) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  const handleAdvance = async (s: Shipment) => {
    const next = FLOW[s.status]; if (!next) return;
    setActionLoading(s.id + next);
    try {
      const res  = await fetch(`/api/logistics/shipments/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShipments(prev => prev.map(x => x.id === s.id ? data.data : x));
      showToast(`Status updated to "${STATUS_LABEL[next]}"`);
    } catch (err: any) { showToast(err.message, 'error'); }
    finally { setActionLoading(null); }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id + 'cancel');
    try {
      const res  = await fetch(`/api/logistics/shipments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShipments(prev => prev.map(x => x.id === id ? data.data : x));
      showToast('Shipment cancelled.');
    } catch (err: any) { showToast(err.message, 'error'); }
    finally { setActionLoading(null); }
  };

  const filtered = statusFilter === 'all' ? shipments : shipments.filter(s => s.status === statusFilter);

  const FlowIcon: Record<string, any> = {
    prep: Clock, in_transit: Truck, delivered: PackageCheck,
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in-up flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle size={16}/> : <XCircle size={16}/>} {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shipments</h1>
          <p className="text-muted-foreground text-sm mt-1">Track all incoming and outgoing shipments</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow hover:opacity-90 transition"
          style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)' }}>
          <Plus size={18}/> New Shipment
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {['po_received','prep','in_transit','delivered','cancelled'].map(s => (
          <div key={s}
            onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
            className={`rounded-xl p-3 text-center border cursor-pointer transition
              ${statusFilter === s ? 'border-amber-400 bg-amber-50' : 'bg-card border-border hover:border-amber-200'}`}>
            <p className="text-xl font-bold text-foreground">{shipments.filter(x => x.status === s).length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{STATUS_LABEL[s]}</p>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition capitalize
              ${statusFilter === s ? 'bg-amber-600 text-white border-amber-600' : 'bg-card border-border text-muted-foreground hover:border-amber-300'}`}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Truck size={48} className="mx-auto mb-3 opacity-20"/>
          <p className="font-semibold text-foreground">No shipments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-amber-200 transition">
              <div className="flex items-center gap-4 p-5 cursor-pointer"
                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Truck size={18} className="text-amber-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{s.shipmentId}</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLE[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.vendorName} → {s.toLocation}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.carrierName} · {s.trackingNumber} · Dispatch: {s.dispatchDate}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-2">
                  <div>
                    <p className="font-bold text-foreground">₹{s.totalValue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{s.items.length} item(s)</p>
                  </div>
                  {expandedId === s.id ? <ChevronUp size={16} className="text-muted-foreground"/> : <ChevronDown size={16} className="text-muted-foreground"/>}
                </div>
              </div>

              {expandedId === s.id && (
                <div className="border-t border-border p-5 bg-muted space-y-4">
                  {/* items */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Items</p>
                    <div className="space-y-2">
                      {s.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-card rounded-xl px-4 py-2.5 border border-border text-sm">
                          <span className="font-medium text-foreground">{item.itemName}</span>
                          <span className="text-muted-foreground">{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* route */}
                  <div className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-border">
                    <div className="flex-1 text-sm">
                      <p className="text-xs text-muted-foreground">From</p>
                      <p className="font-medium text-foreground">{s.fromLocation}</p>
                    </div>
                    <Truck size={18} className="text-amber-500 flex-shrink-0"/>
                    <div className="flex-1 text-sm text-right">
                      <p className="text-xs text-muted-foreground">To ({s.toType})</p>
                      <p className="font-medium text-foreground">{s.toLocation}</p>
                    </div>
                  </div>
                  {/* dates */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {[
                      { label:'Dispatch', value: s.dispatchDate },
                      { label:'Expected', value: s.expectedDelivery },
                      { label:'Delivered', value: s.actualDelivery ?? '—' },
                    ].map(d => (
                      <div key={d.label} className="bg-card rounded-xl p-3 border border-border text-center">
                        <p className="text-xs text-muted-foreground">{d.label}</p>
                        <p className="font-semibold text-foreground mt-0.5">{d.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* actions */}
                  <div className="flex gap-2 flex-wrap">
                    {FLOW[s.status] && (() => {
                      const next   = FLOW[s.status];
                      const NextIcon = FlowIcon[next] ?? Truck;
                      return (
                        <button onClick={() => handleAdvance(s)} disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition disabled:opacity-50">
                          {actionLoading === s.id + next ? <Clock size={14}/> : <NextIcon size={14}/>}
                          Mark as {STATUS_LABEL[next]}
                        </button>
                      );
                    })()}
                    {(s.status === 'po_received' || s.status === 'prep') && (
                      <button onClick={() => handleCancel(s.id)} disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-50">
                        <Ban size={14}/> Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Shipment Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">New Shipment</h2>
              <button onClick={() => { setShowAdd(false); setFormError(''); }}
                className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition">
                <X size={16}/>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle size={15}/> {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label:'Vendor Name', field:'vendorName', placeholder:'PharmaCo' },
                  { label:'Carrier',     field:'carrierName',placeholder:'BlueDart' },
                  { label:'From Location', field:'fromLocation', placeholder:'Mumbai Warehouse', col:2 },
                  { label:'To Location',   field:'toLocation',   placeholder:'S1 Center, Delhi', col:2 },
                ].map(f => (
                  <div key={f.field} className={f.col === 2 ? 'col-span-2' : ''}>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                    <input
                      value={(form as any)[f.field]}
                      onChange={e => setForm({ ...form, [f.field]: e.target.value })}
                      placeholder={f.placeholder} required
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}

                {/* toType */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Destination Type</label>
                  <select value={form.toType} onChange={e => setForm({ ...form, toType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {['center','point','customer'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Total Value (₹)</label>
                  <input type="number" min="0" value={form.totalValue} onChange={e => setForm({ ...form, totalValue: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" required/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Dispatch Date</label>
                  <input type="date" value={form.dispatchDate} onChange={e => setForm({ ...form, dispatchDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Expected Delivery</label>
                  <input type="date" value={form.expectedDelivery} onChange={e => setForm({ ...form, expectedDelivery: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
              </div>

              {/* Item */}
              <div className="p-4 rounded-xl border border-border bg-muted/50 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Item Details</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-xs font-medium text-foreground mb-1">Item Name</label>
                    <input value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} required
                      placeholder="Paracetamol 500mg"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Quantity</label>
                    <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Unit</label>
                    <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      {['units','boxes','strips','pcs','kits'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAdd(false); setFormError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-white font-semibold transition text-sm"
                  style={{ background: saving ? '#fcd34d' : 'linear-gradient(135deg,#d97706,#f59e0b)' }}>
                  {saving ? 'Creating…' : 'Create Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
