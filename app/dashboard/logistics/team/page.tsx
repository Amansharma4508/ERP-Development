'use client';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { MapPin, Plus, X, AlertCircle, CheckCircle, XCircle, Pencil, Trash2 } from 'lucide-react';

interface TeamMember {
  id: string; name: string; role: string; pointId: string;
  area: string; phone: string; status: 'active'|'on_leave'|'inactive'; joiningDate: string;
}

const ROLE_LABEL: Record<string,string> = { ward_boy:'Ward Boy', nurse:'Nurse', junior:'Junior', driver:'Driver', manager:'Manager' };
const ROLE_COLOR: Record<string,string> = {
  ward_boy:'bg-blue-100 text-blue-700', nurse:'bg-pink-100 text-pink-700',
  junior:'bg-indigo-100 text-indigo-700', driver:'bg-amber-100 text-amber-700', manager:'bg-violet-100 text-violet-700',
};
const STATUS_COLOR: Record<string,string> = {
  active:'bg-emerald-100 text-emerald-700', on_leave:'bg-amber-100 text-amber-700', inactive:'bg-gray-100 text-gray-600',
};

export default function TeamPage() {
  const { token } = useAuth();
  const [members, setMembers]   = useState<TeamMember[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast]       = useState<{msg:string;type:'success'|'error'}|null>(null);
  const [form, setForm]         = useState({ name:'', role:'driver', pointId:'S1', area:'', phone:'' });
  const [statusFilter, setStatusFilter] = useState('all');

  const showToast = (msg:string,type:'success'|'error'='success') => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  };

  const fetchTeam = useCallback(async () => {
    if (!token) return;
    const res  = await fetch('/api/logistics/team',{headers:{Authorization:`Bearer ${token}`}});
    const data = await res.json();
    if (data.success) setMembers(data.data);
    setLoading(false);
  },[token]);

  useEffect(()=>{fetchTeam();},[fetchTeam]);

  const openAdd = () => {
    setEditMember(null); setForm({name:'',role:'driver',pointId:'S1',area:'',phone:''});
    setFormError(''); setShowAdd(true);
  };

  const openEdit = (m:TeamMember) => {
    setEditMember(m); setForm({name:m.name,role:m.role,pointId:m.pointId,area:m.area,phone:m.phone});
    setFormError(''); setShowAdd(true);
  };

  const handleSave = async (e:React.FormEvent) => {
    e.preventDefault(); setFormError(''); setSaving(true);
    try {
      const url    = editMember ? `/api/logistics/team/${editMember.id}` : '/api/logistics/team';
      const method = editMember ? 'PATCH' : 'POST';
      const res    = await fetch(url,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(form)});
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error||'Save failed');
      if (editMember) { setMembers(prev=>prev.map(m=>m.id===editMember.id?data.data:m)); showToast('Member updated.'); }
      else { setMembers(prev=>[...prev,data.data]); showToast('Member added.'); }
      setShowAdd(false);
    } catch(err:any){setFormError(err.message);}
    finally{setSaving(false);}
  };

  const handleDelete = async (id:string) => {
    setDeleteId(id);
    try {
      const res  = await fetch(`/api/logistics/team/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
      if (!res.ok) throw new Error('Delete failed');
      setMembers(prev=>prev.filter(m=>m.id!==id)); showToast('Member removed.');
    } catch(err:any){showToast(err.message,'error');}
    finally{setDeleteId(null);}
  };

  const handleStatus = async (id:string, status:string) => {
    try {
      const res  = await fetch(`/api/logistics/team/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({status})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembers(prev=>prev.map(m=>m.id===id?data.data:m)); showToast('Status updated.');
    } catch(err:any){showToast(err.message,'error');}
  };

  const filtered = statusFilter==='all' ? members : members.filter(m=>m.status===statusFilter);

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in-up flex items-center gap-2 ${toast.type==='success'?'bg-emerald-500':'bg-red-500'}`}>
          {toast.type==='success'?<CheckCircle size={16}/>:<XCircle size={16}/>} {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Field Team</h1>
          <p className="text-muted-foreground text-sm mt-1">Ward boys, nurses, drivers and managers at each point</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow hover:opacity-90 transition"
          style={{background:'linear-gradient(135deg,#0891b2,#06b6d4)'}}>
          <Plus size={18}/> Add Member
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {label:'Total',count:members.length,cls:'bg-card border-border'},
          {label:'Active',count:members.filter(m=>m.status==='active').length,cls:'bg-emerald-50 border-emerald-200'},
          {label:'On Leave',count:members.filter(m=>m.status==='on_leave').length,cls:'bg-amber-50 border-amber-200'},
          {label:'Inactive',count:members.filter(m=>m.status==='inactive').length,cls:'bg-gray-50 border-gray-200'},
        ].map(s=>(
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.cls}`}>
            <p className="text-2xl font-bold text-foreground">{s.count}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {['all','active','on_leave','inactive'].map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${statusFilter===s?'bg-white shadow text-foreground':'text-muted-foreground'}`}>
            {s.replace('_',' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i)=><div key={i} className="skeleton h-36 rounded-2xl"/>)}
        </div>
      ) : filtered.length===0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <MapPin size={48} className="mx-auto mb-3 opacity-20"/>
          <p className="font-semibold text-foreground">No team members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m=>(
            <div key={m.id} className="bg-card border border-border rounded-2xl p-5 hover:border-cyan-200 transition group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-base font-bold text-cyan-700">
                    {m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{m.name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLOR[m.role]||'bg-gray-100 text-gray-700'}`}>
                      {ROLE_LABEL[m.role]||m.role}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={()=>openEdit(m)} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"><Pencil size={12}/></button>
                  <button onClick={()=>handleDelete(m.id)} disabled={deleteId===m.id} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"><Trash2 size={12}/></button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><MapPin size={11}/>{m.pointId} · {m.area}</p>
                <p>📞 {m.phone}</p>
                <p>Joined: {m.joiningDate}</p>
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <select value={m.status} onChange={e=>handleStatus(m.id,e.target.value)}
                  className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer w-full ${STATUS_COLOR[m.status]}`}>
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">{editMember?'Edit Member':'Add Team Member'}</h2>
              <button onClick={()=>setShowAdd(false)} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition"><X size={16}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError&&<div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"><AlertCircle size={15}/>{formError}</div>}
              {[{label:'Full Name',field:'name',placeholder:'Sunil Yadav'},{label:'Phone',field:'phone',placeholder:'9811100001'},{label:'Area',field:'area',placeholder:'North Delhi'}].map(f=>(
                <div key={f.field}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                  <input value={(form as any)[f.field]} onChange={e=>setForm({...form,[f.field]:e.target.value})} placeholder={f.placeholder} required={f.field!=='area'}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                  <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {Object.entries(ROLE_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Point</label>
                  <select value={form.pointId} onChange={e=>setForm({...form,pointId:e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {['S1','S2','S3','DHS'].map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-white font-semibold transition text-sm disabled:opacity-50"
                  style={{background:'linear-gradient(135deg,#0891b2,#06b6d4)'}}>
                  {saving?'Saving…':editMember?'Save Changes':'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
