'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import {
  Pill, FlaskConical, Stethoscope, Syringe, FileText, Plus,
  Pencil, Trash2, CheckCircle, XCircle, AlertCircle, X, User, CalendarDays, Droplets,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface HealthRecord {
  id: string; title: string; type: string; doctor: string;
  date: string; description: string; bloodGroup?: string;
  allergies?: string[]; notes?: string; createdAt: string;
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  prescription: Pill, lab_report: FlaskConical,
  diagnosis: Stethoscope, vaccination: Syringe, other: FileText,
};
const TYPE_COLORS: Record<string,string> = {
  prescription:'bg-blue-50 text-blue-700 border-blue-200',
  lab_report:'bg-amber-50 text-amber-700 border-amber-200',
  diagnosis:'bg-violet-50 text-violet-700 border-violet-200',
  vaccination:'bg-emerald-50 text-emerald-700 border-emerald-200',
  other:'bg-gray-50 text-gray-700 border-gray-200',
};
const TYPES = ['prescription','lab_report','diagnosis','vaccination','other'];

export default function HealthRecordsPage() {
  const { token } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editRecord, setEditRecord] = useState<HealthRecord|null>(null);
  const [form, setForm] = useState({title:'',type:'diagnosis',doctor:'',date:'',description:'',bloodGroup:'',allergies:'',notes:''});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);
  const [filterType, setFilterType] = useState('all');

  const showToast = (msg:string, type:'success'|'error'='success') => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  };

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/health-records',{headers:{Authorization:`Bearer ${token}`}});
    const data = await res.json();
    if (data.success) setRecords(data.data);
    setLoading(false);
  },[token]);

  useEffect(()=>{fetchRecords();},[fetchRecords]);

  const openAdd = () => {
    setEditRecord(null);
    setForm({title:'',type:'diagnosis',doctor:'',date:'',description:'',bloodGroup:'',allergies:'',notes:''});
    setFormError(''); setShowAdd(true);
  };
  const openEdit = (r:HealthRecord) => {
    setEditRecord(r);
    setForm({title:r.title,type:r.type,doctor:r.doctor,date:r.date,description:r.description,bloodGroup:r.bloodGroup||'',allergies:(r.allergies||[]).join(', '),notes:r.notes||''});
    setFormError(''); setShowAdd(true);
  };

  const handleSave = async (e:React.FormEvent) => {
    e.preventDefault(); setFormError(''); setSaving(true);
    try {
      const payload={...form,allergies:form.allergies?form.allergies.split(',').map(s=>s.trim()):[]};
      const url=editRecord?`/api/health-records/${editRecord.id}`:'/api/health-records';
      const res=await fetch(url,{method:editRecord?'PATCH':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(payload)});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||'Save failed');
      if(editRecord){setRecords(prev=>prev.map(r=>r.id===editRecord.id?data.data:r));showToast('Record updated.');}
      else{setRecords(prev=>[...prev,data.data]);showToast('Record added.');}
      setShowAdd(false);
    } catch(err:any){setFormError(err.message);}
    finally{setSaving(false);}
  };

  const handleDelete = async (id:string) => {
    setDeleteId(id);
    try {
      const res=await fetch(`/api/health-records/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error);
      setRecords(prev=>prev.filter(r=>r.id!==id)); showToast('Record deleted.');
    } catch(err:any){showToast(err.message,'error');}
    finally{setDeleteId(null);}
  };

  const filtered = filterType==='all'?records:records.filter(r=>r.type===filterType);

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in-up flex items-center gap-2
          ${toast.type==='success'?'bg-emerald-500':'bg-red-500'}`}>
          {toast.type==='success'?<CheckCircle size={16}/>:<XCircle size={16}/>} {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Health Records</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your medical history and documents</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow transition hover:opacity-90"
          style={{background:'linear-gradient(135deg,#0891b2,#06b6d4)'}}>
          <Plus size={18}/> Add Record
        </button>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {['all',...TYPES].map(t=>{
          const Icon = t!=='all'?TYPE_ICONS[t]:null;
          return (
            <button key={t} onClick={()=>setFilterType(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition
                ${filterType===t?'bg-cyan-600 text-white border-cyan-600':'bg-card border-border text-muted-foreground hover:border-cyan-300'}`}>
              {Icon && <Icon size={12}/>}
              {t==='all'?'All Types':t.replace('_',' ')}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-40 rounded-2xl"/>)}</div>
      ) : filtered.length===0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <FileText size={48} className="mx-auto mb-3 opacity-20"/>
          <p className="font-semibold text-foreground">No health records yet</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Add Record" to start tracking your medical history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(r=>{
            const Icon = TYPE_ICONS[r.type] || FileText;
            return (
              <div key={r.id} className="bg-card border border-border rounded-2xl p-5 hover:border-cyan-200 transition group animate-fade-in-up">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-50 flex-shrink-0">
                      <Icon size={18} className="text-cyan-600"/>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{r.title}</h3>
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border mt-0.5 ${TYPE_COLORS[r.type]}`}>
                        {r.type.replace('_',' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={()=>openEdit(r)}
                      className="w-7 h-7 rounded-lg bg-muted hover:bg-indigo-100 text-muted-foreground hover:text-indigo-600 flex items-center justify-center transition">
                      <Pencil size={12}/>
                    </button>
                    <button onClick={()=>handleDelete(r.id)} disabled={deleteId===r.id}
                      className="w-7 h-7 rounded-lg bg-muted hover:bg-red-100 text-muted-foreground hover:text-red-600 flex items-center justify-center transition disabled:opacity-50">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{r.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User size={11}/> {r.doctor}</span>
                  <span className="flex items-center gap-1"><CalendarDays size={11}/> {r.date}</span>
                  {r.bloodGroup && <span className="flex items-center gap-1"><Droplets size={11}/> {r.bloodGroup}</span>}
                </div>
                {r.allergies && r.allergies.length>0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.allergies.map(a=>(
                      <span key={a} className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full border border-red-200">{a}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">{editRecord?'Edit Record':'Add Health Record'}</h2>
              <button onClick={()=>setShowAdd(false)} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition"><X size={16}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"><AlertCircle size={15}/> {formError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                  <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required placeholder="e.g. Annual Blood Test"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
                  <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {TYPES.map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Doctor / Source</label>
                  <input value={form.doctor} onChange={e=>setForm({...form,doctor:e.target.value})} placeholder="Dr. John Smith"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                  <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required rows={3}
                    placeholder="Describe the record details…"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Blood Group</label>
                  <select value={form.bloodGroup} onChange={e=>setForm({...form,bloodGroup:e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Not specified</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg=><option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Allergies</label>
                  <input value={form.allergies} onChange={e=>setForm({...form,allergies:e.target.value})} placeholder="Penicillin, Dust (comma separated)"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-white font-semibold transition text-sm"
                  style={{background:saving?'#67e8f9':'linear-gradient(135deg,#0891b2,#06b6d4)'}}>
                  {saving?'Saving…':editRecord?'Save Changes':'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
