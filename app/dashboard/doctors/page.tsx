'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Search, Star, Stethoscope, CalendarDays, DollarSign, Award, X, Clock } from 'lucide-react';

interface Doctor {
  id:string; fullName:string; email:string; specialization:string;
  license:string; experience:number; rating:number; reviewCount:number;
  consultationFee:number; bio:string;
  availableSlots:{day:string;startTime:string;endTime:string}[];
}

const SPECIALIZATIONS=['All','Cardiology','Neurology','Dermatology','Orthopedics','Pediatrics','Gynecology'];

function StarRating({rating}:{rating:number}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s=>(
        <Star key={s} size={12} className={s<=Math.round(rating)?'fill-amber-400 text-amber-400':'text-gray-200 fill-gray-200'}/>
      ))}
    </div>
  );
}

export default function DoctorsPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor|null>(null);

  const fetchDoctors = useCallback(async () => {
    const res=await fetch('/api/doctors');
    const data=await res.json();
    if(data.success) setDoctors(data.data);
    setLoading(false);
  },[]);

  useEffect(()=>{fetchDoctors();},[fetchDoctors]);

  const filtered=doctors.filter(d=>{
    const matchSearch=d.fullName.toLowerCase().includes(search.toLowerCase())||d.specialization.toLowerCase().includes(search.toLowerCase());
    const matchSpec=specFilter==='All'||d.specialization===specFilter;
    return matchSearch&&matchSpec;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Find Doctors</h1>
        <p className="text-muted-foreground text-sm mt-1">Browse our network of qualified healthcare professionals</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or specialization…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
      </div>

      <div className="flex flex-wrap gap-2">
        {SPECIALIZATIONS.map(s=>(
          <button key={s} onClick={()=>setSpecFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition
              ${specFilter===s?'bg-indigo-600 text-white border-indigo-600':'bg-card border-border text-muted-foreground hover:border-indigo-300 hover:text-indigo-600'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(3)].map((_,i)=><div key={i} className="skeleton h-56 rounded-2xl"/>)}
        </div>
      ) : filtered.length===0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Search size={48} className="mx-auto mb-3 opacity-20"/>
          <p className="font-semibold text-foreground">No doctors found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(doc=>(
            <div key={doc.id}
              className="bg-card border border-border rounded-2xl p-6 hover:border-indigo-200 hover:shadow-md transition group animate-fade-in-up flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{background:'linear-gradient(135deg,#e0e7ff,#c7d2fe)'}}>
                  <Stethoscope size={26} className="text-indigo-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{doc.fullName}</h3>
                  <p className="text-indigo-600 text-sm font-medium">{doc.specialization}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <StarRating rating={doc.rating}/>
                    <span className="text-xs text-muted-foreground">{doc.rating} ({doc.reviewCount})</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{doc.bio}</p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-xl bg-muted">
                  <p className="text-sm font-bold text-foreground">{doc.experience}y</p>
                  <p className="text-xs text-muted-foreground">Exp</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-muted">
                  <p className="text-sm font-bold text-foreground">${doc.consultationFee}</p>
                  <p className="text-xs text-muted-foreground">Fee</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-muted">
                  <p className="text-sm font-bold text-foreground">{doc.availableSlots.length}</p>
                  <p className="text-xs text-muted-foreground">Days/wk</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {doc.availableSlots.map(slot=>(
                  <span key={slot.day} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-lg border border-indigo-100 flex items-center gap-1">
                    <CalendarDays size={10}/> {slot.day.slice(0,3)}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={()=>setSelectedDoctor(doc)}
                  className="flex-1 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-sm font-medium transition">
                  View Profile
                </button>
                {user?.role==='user' && (
                  <button onClick={()=>router.push('/dashboard/appointments')}
                    className="flex-1 py-2 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
                    style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
                    Book Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Doctor Profile</h2>
              <button onClick={()=>setSelectedDoctor(null)} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition"><X size={16}/></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{background:'linear-gradient(135deg,#e0e7ff,#c7d2fe)'}}>
                  <Stethoscope size={30} className="text-indigo-600"/>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedDoctor.fullName}</h3>
                  <p className="text-indigo-600 font-medium">{selectedDoctor.specialization}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={selectedDoctor.rating}/>
                    <span className="text-sm text-muted-foreground">{selectedDoctor.rating} · {selectedDoctor.reviewCount} reviews</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{selectedDoctor.bio}</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {label:'Experience',value:`${selectedDoctor.experience} years`,Icon:Award},
                  {label:'Consultation Fee',value:`$${selectedDoctor.consultationFee}`,Icon:DollarSign},
                  {label:'License',value:selectedDoctor.license,Icon:Award},
                  {label:'Email',value:selectedDoctor.email,Icon:Stethoscope},
                ].map(item=>(
                  <div key={item.label} className="p-3 rounded-xl bg-muted">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><item.Icon size={11}/> {item.label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5 truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Available Schedule</h4>
                <div className="space-y-2">
                  {selectedDoctor.availableSlots.map(slot=>(
                    <div key={slot.day} className="flex items-center justify-between p-3 rounded-xl bg-muted">
                      <span className="text-sm font-medium text-foreground flex items-center gap-2"><CalendarDays size={14} className="text-indigo-500"/>{slot.day}</span>
                      <span className="text-sm text-indigo-600 font-medium flex items-center gap-1"><Clock size={13}/>{slot.startTime} – {slot.endTime}</span>
                    </div>
                  ))}
                </div>
              </div>

              {user?.role==='user' && (
                <button onClick={()=>{setSelectedDoctor(null);router.push('/dashboard/appointments');}}
                  className="w-full py-3 rounded-xl text-white font-semibold transition hover:opacity-90"
                  style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
                  Book Appointment — ${selectedDoctor.consultationFee}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
