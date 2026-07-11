'use client';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, X, AlertCircle, CheckCircle, XCircle, Star, Pencil, Trash2 } from 'lucide-react';

interface Vendor {
  id: string; vendorId: string; name: string; category: string; categoryName: string;
  contactPerson: string; email: string; phone: string; address: string; area: string;
  gstNo: string; licenseNo: string; paymentTerms: string; creditDays: number;
  rating: number; supplyStatus: 'active'|'inactive'|'suspended';
  totalOrders: number; paidAmount: number; dueAmount: number; createdAt: string;
}

const STATUS_COLOR: Record<string,string> = {
  active:'bg-emerald-100 text-emerald-700', inactive:'bg-gray-100 text-gray-600', suspended:'bg-red-100 text-red-700',
};

const VENDOR_CATEGORIES = [
  '1-Manpower','2-Medical Supply','3-IT & Tech','4-Medical Equipment','5-Transport',
  '6-Local Delivery','7-Land & Asset','8-Construction','9-Marketing','10-Promotion',
  '11-Print Media','12-Skill Dev','13-Vehicle & Fleet','14-Electrical','15-Office & Infra',
];

export default function VendorsPage() {
  const { token } = useAuth();
  const [vendors, setVendors]   = useState<Vendor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd]   = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast]       = useState<{msg:string;type:'success'|'error'}|null>(null);
  const [form, setForm] = useState({
    name:'', categoryName:'Medical Supply', category:'2',
    contactPerson:'', email:'', phone:'', address:'', area:'',
    gstNo:'', licenseNo:'', paymentTerms:'Net 30', creditDays:'30',
  });

  const showToast = (msg:string,type:'success'|'error'='success') => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  };

  const fetchVendors = useCallback(async () => {
    if (!token) return;
    const res  = await fetch('/api/logistics/vendors', { headers:{ Authorization:`Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setVendors(data.data);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const openAdd = () => {
    setEditVendor(null);
    setForm({ name:'', categoryName:'Medical Supply', category:'2', contactPerson:'', email:'', phone:'', address:'', area:'', gstNo:'', licenseNo:'', paymentTerms:'Net 30', creditDays:'30' });
    setFormError(''); setShowAdd(true);
  };

  const openEdit = (v: Vendor) => {
    setEditVendor(v);
    setForm({ name:v.name, categoryName:v.categoryName, category:v.category, contactPerson:v.contactPerson, email:v.email, phone:v.phone, address:v.address, area:v.area, gstNo:v.gstNo, licenseNo:v.licenseNo, paymentTerms:v.paymentTerms, creditDays:String(v.creditDays) });
    setFormError(''); setShowAdd(true);
  };

  const handleSave = async (e:React.FormEvent) => {
    e.preventDefault(); setFormError(''); setSaving(true);
    try {
      const url    = editVendor ? `/api/logistics/vendors/${editVendor.id}` : '/api/logistics/vendors';
      const method = editVendor ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({...form,creditDays:Number(form.creditDays)}) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error||'Save failed');
      if (editVendor) { setVendors(prev=>prev.map(v=>v.id===editVendor.id?data.data:v)); showToast('Vendor updated.'); }
      else { setVendors(prev=>[...prev,data.data]); showToast('Vendor added.'); }
      setShowAdd(false);
    } catch(err:any) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id:string) => {
    setDeleteId(id);
    try {
      const res  = await fetch(`/api/logistics/vendors/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVendors(prev=>prev.filter(v=>v.id!==id)); showToast('Vendor removed.');
    } catch(err:any) { showToast(err.message,'error'); }
    finally { setDeleteId(null); }
  };

  const handleStatus = async (id:string, supplyStatus:string) => {
    try {
      const res  = await fetch(`/api/logistics/vendors/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({supplyStatus})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVendors(prev=>prev.map(v=>v.id===id?data.data:v)); showToast('Status updated.');
    } catch(err:any) { showToast(err.message,'error'); }
  };

  const filtered = vendors.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.vendorId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter==='all' || v.supplyStatus===statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in-up flex items-center gap-2 ${toast.type==='success'?'bg-emerald-500':'bg-red-500'}`}>
          {toast.type==='success'?<CheckCircle size={16}/>:<XCircle size={16}/>} {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all vendor registrations and supply status</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow hover:opacity-90 transition"
          style={{background:'linear-gradient(135deg,#7c3aed,#a78bfa)'}}>
          <Plus size={18}/> Add Vendor
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[{label:'Total',count:vendors.length,cls:'bg-card border-border'},{label:'Active',count:vendors.filter(v=>v.supplyStatus==='active').length,cls:'bg-emerald-50 border-emerald-200'},{label:'Inactive',count:vendors.filter(v=>v.supplyStatus!=='active').length,cls:'bg-red-50 border-red-200'}].map(s=>(
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.cls}`}>
            <p className="text-2xl font-bold text-foreground">{s.count}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendors…"
            className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {['all','active','inactive','suspended'].map(s=>(
            <button key={s} onClick={()=>setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${statusFilter===s?'bg-white shadow text-foreground':'text-muted-foreground'}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-20 rounded-2xl"/>)}</div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  {['Vendor','Category','Contact','GST / License','Payment','Orders','Due','Status','Actions'].map(h=>(
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length===0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">No vendors found</td></tr>
                ) : filtered.map(v=>(
                  <tr key={v.id} className="hover:bg-muted transition">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-foreground">{v.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{v.vendorId}</p>
                    </td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 text-xs border border-violet-200">{v.categoryName}</span></td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-foreground">{v.contactPerson}</p>
                      <p className="text-xs text-muted-foreground">{v.phone}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-mono text-foreground">{v.gstNo || '—'}</p>
                      <p className="text-xs text-muted-foreground">{v.licenseNo || '—'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs text-foreground">{v.paymentTerms}</p>
                      <p className="text-xs text-muted-foreground">{v.creditDays}d credit</p>
                    </td>
                    <td className="px-5 py-3 text-foreground font-medium">{v.totalOrders}</td>
                    <td className={`px-5 py-3 font-bold ${v.dueAmount>0?'text-red-600':'text-emerald-600'}`}>
                      {v.dueAmount>0?`₹${v.dueAmount.toLocaleString()}`:'Clear'}
                    </td>
                    <td className="px-5 py-3">
                      <select value={v.supplyStatus} onChange={e=>handleStatus(v.id,e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLOR[v.supplyStatus]}`}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button onClick={()=>openEdit(v)} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"><Pencil size={13}/></button>
                        <button onClick={()=>handleDelete(v.id)} disabled={deleteId===v.id} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">{editVendor?'Edit Vendor':'Add Vendor'}</h2>
              <button onClick={()=>setShowAdd(false)} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition"><X size={16}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError&&<div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"><AlertCircle size={15}/>{formError}</div>}
              <div className="grid grid-cols-2 gap-4">
                {[
                  {label:'Vendor Name',field:'name',placeholder:'PharmaCo',col:2},
                  {label:'Contact Person',field:'contactPerson',placeholder:'Anil Sharma'},
                  {label:'Phone',field:'phone',placeholder:'9811234567'},
                  {label:'Email',field:'email',placeholder:'vendor@email.com',col:2},
                  {label:'Area',field:'area',placeholder:'Mumbai'},
                  {label:'GST No',field:'gstNo',placeholder:'27AABCU9603R1ZM'},
                  {label:'License No',field:'licenseNo',placeholder:'LIC-PH-2024-001'},
                  {label:'Payment Terms',field:'paymentTerms',placeholder:'Net 30'},
                  {label:'Credit Days',field:'creditDays',placeholder:'30'},
                ].map(f=>(
                  <div key={f.field} className={f.col===2?'col-span-2':''}>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                    <input value={(form as any)[f.field]} onChange={e=>setForm({...form,[f.field]:e.target.value})} placeholder={f.placeholder} required={['name','contactPerson','email','phone'].includes(f.field)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                  <select value={form.categoryName} onChange={e=>{const[cat,...rest]=e.target.value.split('-');setForm({...form,category:cat.trim(),categoryName:rest.join('-').trim()});}}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {VENDOR_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-white font-semibold transition text-sm" style={{background:saving?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#a78bfa)'}}>
                  {saving?'Saving…':editVendor?'Save Changes':'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
