'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import {
  CalendarDays, Clock, CheckCircle, XCircle, Plus, Star, DollarSign,
  AlertCircle, Check, X, Target, Ban, CalendarCheck, CreditCard,
  Smartphone, Wallet, ChevronRight, ChevronLeft, ShieldCheck,
  Receipt, Copy, ArrowRight,
} from 'lucide-react';

interface Appointment {
  id: string; patientId: string; patientName: string;
  doctorId: string; doctorName: string; specialization: string;
  date: string; time: string;
  status: 'pending'|'confirmed'|'completed'|'cancelled'|'rejected';
  notes: string; consultationFee: number; createdAt: string;
}
interface Doctor {
  id: string; fullName: string; specialization: string;
  consultationFee: number; rating: number; experience: number;
  availableSlots: { day: string; startTime: string; endTime: string }[];
}
interface PaymentResult {
  appointment: Appointment;
  payment: {
    id: string; transactionRef: string; method: string;
    methodDetails: string; amount: number; paidAt: string; status: string;
  };
}

type PaymentMethod = 'wallet' | 'credit_card' | 'debit_card' | 'upi';
type BookStep = 'details' | 'payment' | 'processing' | 'receipt';

const STATUS_STYLE: Record<string,string> = {
  pending:'badge-pending', confirmed:'badge-confirmed',
  completed:'badge-completed', cancelled:'badge-cancelled', rejected:'badge-rejected',
};
const TIME_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30','12:00',
  '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00',
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string; desc: string; Icon: any }[] = [
  { id: 'wallet',      label: 'Wallet Balance', desc: 'Pay using your wallet funds',     Icon: Wallet     },
  { id: 'credit_card', label: 'Credit Card',    desc: 'Visa, Mastercard, Amex',          Icon: CreditCard },
  { id: 'debit_card',  label: 'Debit Card',     desc: 'All major bank debit cards',      Icon: CreditCard },
  { id: 'upi',         label: 'UPI',            desc: 'GPay, PhonePe, Paytm, BHIM',     Icon: Smartphone },
];

export default function AppointmentsPage() {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all'|'pending'|'confirmed'|'completed'>('all');

  // booking wizard state
  const [showBook, setShowBook]     = useState(false);
  const [step, setStep]             = useState<BookStep>('details');
  const [bookForm, setBookForm]     = useState({ doctorId:'', date:'', time:'', notes:'' });
  const [payMethod, setPayMethod]   = useState<PaymentMethod>('wallet');
  const [cardForm, setCardForm]     = useState({ number:'', expiry:'', cvv:'', holder:'' });
  const [upiId, setUpiId]           = useState('');
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError]     = useState('');
  const [receipt, setReceipt]       = useState<PaymentResult|null>(null);
  const [copied, setCopied]         = useState(false);

  // action state
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);

  const showToast = (msg:string, type:'success'|'error'='success') => {
    setToast({msg,type}); setTimeout(()=>setToast(null), 3500);
  };

  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/appointments', { headers:{ Authorization:`Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setAppointments(data.data);
    setLoading(false);
  }, [token]);

  const fetchDoctors = useCallback(async () => {
    const res = await fetch('/api/doctors');
    const data = await res.json();
    if (data.success) setDoctors(data.data);
  }, []);

  const fetchWallet = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/wallet', { headers:{ Authorization:`Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setWalletBalance(data.data.balance);
  }, [token]);

  useEffect(() => {
    fetchAppointments(); fetchDoctors(); fetchWallet();
  }, [fetchAppointments, fetchDoctors, fetchWallet]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const resetModal = () => {
    setShowBook(false); setStep('details');
    setBookForm({ doctorId:'', date:'', time:'', notes:'' });
    setPayMethod('wallet'); setCardForm({ number:'', expiry:'', cvv:'', holder:'' });
    setUpiId(''); setPayError(''); setReceipt(null); setCopied(false);
  };

  const selectedDoctor = doctors.find(d => d.id === bookForm.doctorId);

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();

  const formatExpiry = (v: string) =>
    v.replace(/\D/g,'').slice(0,4).replace(/^(\d{2})(\d)/,'$1/$2');

  // ── Client-side validation helpers ───────────────────────────────────────
  const luhn = (num: string) => {
    const digits = num.replace(/\s/g,'');
    if (!/^\d{13,19}$/.test(digits)) return false;
    let sum = 0, alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits[i], 10);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return sum % 10 === 0;
  };

  const expiryValid = (exp: string) => {
    if (!/^\d{2}\/\d{2}$/.test(exp)) return false;
    const [mm, yy] = exp.split('/').map(Number);
    if (mm < 1 || mm > 12) return false;
    const now = new Date();
    return new Date(2000 + yy, mm - 1, 1) >= new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const upiValid = (id: string) => /^[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{2,}$/.test(id.trim());

  // inline field errors
  const cardErrors = {
    number:  cardForm.number.length > 0  && !luhn(cardForm.number)      ? 'Invalid card number' : '',
    expiry:  cardForm.expiry.length === 5 && !expiryValid(cardForm.expiry) ? 'Card expired or invalid date' : '',
    cvv:     cardForm.cvv.length > 0     && !/^\d{3,4}$/.test(cardForm.cvv) ? 'CVV must be 3–4 digits' : '',
    holder:  cardForm.holder.length > 0  && cardForm.holder.trim().split(/\s+/).length < 2 ? 'Enter first and last name' : '',
  };
  const upiError = upiId.length > 0 && !upiValid(upiId) ? 'Invalid UPI ID — e.g. john@okaxis' : '';

  const cardFormValid =
    luhn(cardForm.number) &&
    expiryValid(cardForm.expiry) &&
    /^\d{3,4}$/.test(cardForm.cvv) &&
    cardForm.holder.trim().split(/\s+/).length >= 2;

  const payButtonDisabled =
    (payMethod === 'wallet' && walletBalance < (selectedDoctor?.consultationFee ?? 0)) ||
    ((payMethod === 'credit_card' || payMethod === 'debit_card') && !cardFormValid) ||
    (payMethod === 'upi' && !upiValid(upiId));

  // ── step 1 → 2 ────────────────────────────────────────────────────────────
  const handleDetailsNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.doctorId || !bookForm.date || !bookForm.time) {
      setPayError('Please select a doctor, date and time.'); return;
    }
    setPayError(''); setStep('payment');
  };

  // ── step 2 → process ──────────────────────────────────────────────────────
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(''); setStep('processing'); setProcessing(true);

    try {
      const body: any = {
        doctorId:      bookForm.doctorId,
        date:          bookForm.date,
        time:          bookForm.time,
        notes:         bookForm.notes,
        paymentMethod: payMethod,
      };
      if (payMethod === 'credit_card' || payMethod === 'debit_card') {
        body.cardNumber = cardForm.number.replace(/\s/g,'');
        body.cardExpiry = cardForm.expiry;
        body.cardCvv    = cardForm.cvv;
        body.cardHolder = cardForm.holder;
      }
      if (payMethod === 'upi') body.upiId = upiId;

      // Simulate slight processing delay for realism
      await new Promise(r => setTimeout(r, 1800));

      const res  = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      setReceipt(data.data);
      setAppointments(prev => [...prev, data.data.appointment]);
      if (payMethod === 'wallet') setWalletBalance(prev => prev - (selectedDoctor?.consultationFee ?? 0));
      setStep('receipt');
    } catch (err: any) {
      setPayError(err.message);
      setStep('payment');
    } finally {
      setProcessing(false);
    }
  };

  const copyRef = () => {
    if (!receipt) return;
    navigator.clipboard.writeText(receipt.payment.transactionRef);
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  // ── appointment action (accept/reject/cancel) ─────────────────────────────
  const handleAction = async (id:string, status:string) => {
    setActionLoading(id+status);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method:'PATCH',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Action failed');
      setAppointments(prev => prev.map(a => a.id===id ? data.data : a));
      if (status === 'cancelled' || status === 'rejected') fetchWallet();
      showToast(`Appointment ${status} successfully.`);
    } catch (err:any) { showToast(err.message,'error'); }
    finally { setActionLoading(null); }
  };

  const filtered = activeTab==='all' ? appointments : appointments.filter(a=>a.status===activeTab);
  const tabs: { key: typeof activeTab; label: string }[] = [
    {key:'all',label:'All'}, {key:'pending',label:'Pending'},
    {key:'confirmed',label:'Confirmed'}, {key:'completed',label:'Completed'},
  ];
  const summaryCards = [
    {label:'Total',   count:appointments.length,                              cls:'bg-indigo-50 text-indigo-700',  Icon:CalendarDays},
    {label:'Pending', count:appointments.filter(a=>a.status==='pending').length,  cls:'bg-amber-50 text-amber-700',    Icon:Clock},
    {label:'Confirmed',count:appointments.filter(a=>a.status==='confirmed').length,cls:'bg-emerald-50 text-emerald-700',Icon:CheckCircle},
    {label:'Completed',count:appointments.filter(a=>a.status==='completed').length,cls:'bg-blue-50 text-blue-700',     Icon:Target},
  ];

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in-up flex items-center gap-2
          ${toast.type==='success'?'bg-emerald-500':'bg-red-500'}`}>
          {toast.type==='success'?<CheckCircle size={16}/>:<XCircle size={16}/>} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user?.role==='doctor'?'Manage patient appointment requests':'Your scheduled appointments'}
          </p>
        </div>
        {user?.role==='user' && (
          <button onClick={()=>{resetModal();setShowBook(true);}}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow transition hover:opacity-90"
            style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
            <Plus size={18}/> Book Appointment
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(s=>(
          <div key={s.label} className={`rounded-xl p-4 ${s.cls} flex items-center gap-3`}>
            <s.Icon size={24}/>
            <div>
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs font-medium opacity-75">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab===t.key?'bg-white shadow text-foreground':'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Appointment list */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="skeleton h-24 rounded-2xl"/>)}</div>
      ) : filtered.length===0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <CalendarDays size={48} className="mx-auto mb-3 opacity-20"/>
          <p className="font-semibold text-foreground">No appointments found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {user?.role==='user'?'Book your first appointment above.':'No patient appointments yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(appt=>(
            <div key={appt.id}
              className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-indigo-200 transition">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{background:'linear-gradient(135deg,#e0e7ff,#c7d2fe)'}}>
                  <CalendarDays size={22} className="text-indigo-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">
                      {user?.role==='doctor'?appt.patientName:appt.doctorName}
                    </p>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLE[appt.status]}`}>
                      {appt.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{appt.specialization}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays size={13}/>{appt.date}</span>
                    <span className="flex items-center gap-1"><Clock size={13}/>{appt.time}</span>
                    <span className="flex items-center gap-1"><DollarSign size={13}/>${appt.consultationFee}</span>
                  </div>
                  {appt.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{appt.notes}"</p>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {user?.role==='doctor' && appt.status==='pending' && (<>
                  <button onClick={()=>handleAction(appt.id,'confirmed')} disabled={!!actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition disabled:opacity-50">
                    {actionLoading===appt.id+'confirmed'?<Clock size={14}/>:<Check size={14}/>} Accept
                  </button>
                  <button onClick={()=>handleAction(appt.id,'rejected')} disabled={!!actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-50">
                    {actionLoading===appt.id+'rejected'?<Clock size={14}/>:<X size={14}/>} Reject
                  </button>
                </>)}
                {user?.role==='doctor' && appt.status==='confirmed' && (
                  <button onClick={()=>handleAction(appt.id,'completed')} disabled={!!actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition disabled:opacity-50">
                    {actionLoading===appt.id+'completed'?<Clock size={14}/>:<Target size={14}/>} Mark Complete
                  </button>
                )}
                {user?.role==='user' && (appt.status==='pending'||appt.status==='confirmed') && (
                  <button onClick={()=>handleAction(appt.id,'cancelled')} disabled={!!actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium transition disabled:opacity-50">
                    {actionLoading===appt.id+'cancelled'?<Clock size={14}/>:<Ban size={14}/>} Cancel
                  </button>
                )}
                {user?.role==='admin' && appt.status==='pending' && (<>
                  <button onClick={()=>handleAction(appt.id,'confirmed')} disabled={!!actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition disabled:opacity-50">
                    <Check size={14}/> Accept
                  </button>
                  <button onClick={()=>handleAction(appt.id,'rejected')} disabled={!!actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-50">
                    <X size={14}/> Reject
                  </button>
                </>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BOOKING MODAL ─────────────────────────────────────────────────── */}
      {showBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg max-h-[92vh] overflow-y-auto animate-fade-in-up">

            {/* ── STEP INDICATOR (details + payment only) ── */}
            {(step==='details'||step==='payment') && (
              <div className="px-6 pt-6 pb-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-foreground">
                    {step==='details' ? 'Book Appointment' : 'Payment'}
                  </h2>
                  <button onClick={resetModal}
                    className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition">
                    <X size={16}/>
                  </button>
                </div>
                {/* progress bar */}
                <div className="flex items-center gap-2">
                  {['Appointment Details','Payment Method','Confirmation'].map((label,i)=>{
                    const idx = step==='details'?0:1;
                    return (
                      <div key={label} className="flex items-center gap-2 flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                          ${i<=idx?'bg-indigo-600 text-white':'bg-muted text-muted-foreground'}`}>
                          {i<idx?<Check size={12}/>:i+1}
                        </div>
                        <span className={`text-xs hidden sm:block ${i<=idx?'text-indigo-600 font-medium':'text-muted-foreground'}`}>{label}</span>
                        {i<2 && <div className={`flex-1 h-0.5 ${i<idx?'bg-indigo-600':'bg-muted'}`}/>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                STEP 1 — APPOINTMENT DETAILS
            ═══════════════════════════════════════════════ */}
            {step==='details' && (
              <form onSubmit={handleDetailsNext} className="p-6 space-y-5">
                {payError && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                    <AlertCircle size={15}/> {payError}
                  </div>
                )}

                {/* Doctor selection */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Select Doctor</label>
                  <div className="space-y-2">
                    {doctors.map(doc=>(
                      <label key={doc.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition
                          ${bookForm.doctorId===doc.id?'border-indigo-500 bg-indigo-50':'border-border hover:border-indigo-200'}`}>
                        <input type="radio" name="doctor" value={doc.id} checked={bookForm.doctorId===doc.id}
                          onChange={e=>setBookForm({...bookForm,doctorId:e.target.value})} className="sr-only"/>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                          ${bookForm.doctorId===doc.id?'bg-indigo-600':'bg-indigo-100'}`}>
                          <CalendarCheck size={18} className={bookForm.doctorId===doc.id?'text-white':'text-indigo-600'}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm">{doc.fullName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                            {doc.specialization}
                            <span className="flex items-center gap-0.5 ml-1">
                              <Star size={10} className="fill-amber-400 text-amber-400"/> {doc.rating}
                            </span>
                            · {doc.experience}y exp
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-indigo-600">${doc.consultationFee}</p>
                          <p className="text-xs text-muted-foreground">fee</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                    <input type="date" value={bookForm.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e=>setBookForm({...bookForm,date:e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" required/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Time</label>
                    <select value={bookForm.time} onChange={e=>setBookForm({...bookForm,time:e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" required>
                      <option value="">Select time</option>
                      {TIME_SLOTS.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Notes <span className="text-muted-foreground">(optional)</span></label>
                  <textarea value={bookForm.notes} onChange={e=>setBookForm({...bookForm,notes:e.target.value})}
                    rows={3} placeholder="Describe your symptoms or reason for visit…"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"/>
                </div>

                {/* fee preview */}
                {selectedDoctor && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                    <div>
                      <p className="text-sm font-semibold text-indigo-800">{selectedDoctor.fullName}</p>
                      <p className="text-xs text-indigo-500">{selectedDoctor.specialization}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-indigo-500">Consultation fee</p>
                      <p className="text-xl font-bold text-indigo-700">${selectedDoctor.consultationFee}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={resetModal}
                    className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition text-sm">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 rounded-xl text-white font-semibold transition text-sm flex items-center justify-center gap-2"
                    style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
                    Next: Payment <ChevronRight size={16}/>
                  </button>
                </div>
              </form>
            )}

            {/* ═══════════════════════════════════════════════
                STEP 2 — PAYMENT METHOD
            ═══════════════════════════════════════════════ */}
            {step==='payment' && (
              <form onSubmit={handlePay} className="p-6 space-y-5">
                {payError && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                    <AlertCircle size={15}/> {payError}
                  </div>
                )}

                {/* order summary */}
                <div className="p-4 rounded-xl bg-muted border border-border space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order Summary</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{selectedDoctor?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{bookForm.date} · {bookForm.time}</p>
                    </div>
                    <p className="text-xl font-bold text-foreground">${selectedDoctor?.consultationFee}</p>
                  </div>
                </div>

                {/* payment method selector */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Choose Payment Method</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map(pm=>(
                      <button type="button" key={pm.id}
                        onClick={()=>{setPayMethod(pm.id); setPayError('');}}
                        className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition
                          ${payMethod===pm.id?'border-indigo-500 bg-indigo-50':'border-border hover:border-indigo-200'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                          ${payMethod===pm.id?'bg-indigo-600':'bg-muted'}`}>
                          <pm.Icon size={16} className={payMethod===pm.id?'text-white':'text-muted-foreground'}/>
                        </div>
                        <p className={`text-sm font-semibold ${payMethod===pm.id?'text-indigo-700':'text-foreground'}`}>{pm.label}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{pm.desc}</p>
                        {pm.id==='wallet' && (
                          <p className={`text-xs font-bold mt-0.5 ${walletBalance>=(selectedDoctor?.consultationFee??0)?'text-emerald-600':'text-red-500'}`}>
                            Balance: ${walletBalance.toLocaleString()}
                            {walletBalance<(selectedDoctor?.consultationFee??0) && ' (insufficient)'}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {(payMethod==='credit_card'||payMethod==='debit_card') && (
                  <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <ShieldCheck size={12}/> Secure Card Details
                    </p>
                    {/* Card Number */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Card Number</label>
                      <input value={cardForm.number}
                        onChange={e=>setCardForm({...cardForm,number:formatCardNumber(e.target.value)})}
                        placeholder="1234 5678 9012 3456" maxLength={19} required
                        className={`w-full px-3 py-2.5 rounded-xl border bg-card text-foreground text-sm focus:outline-none focus:ring-2 font-mono tracking-widest transition
                          ${cardErrors.number ? 'border-red-400 focus:ring-red-300' : cardForm.number && luhn(cardForm.number) ? 'border-emerald-400 focus:ring-emerald-300' : 'border-border focus:ring-ring'}`}/>
                      {cardErrors.number && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11}/>{cardErrors.number}</p>}
                      {cardForm.number && luhn(cardForm.number) && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle size={11}/>Valid card number</p>}
                    </div>
                    {/* Cardholder Name */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Cardholder Name</label>
                      <input value={cardForm.holder}
                        onChange={e=>setCardForm({...cardForm,holder:e.target.value.replace(/[^a-zA-Z\s]/g,'')})}
                        placeholder="John Carter" required
                        className={`w-full px-3 py-2.5 rounded-xl border bg-card text-foreground text-sm focus:outline-none focus:ring-2 transition
                          ${cardErrors.holder ? 'border-red-400 focus:ring-red-300' : cardForm.holder && cardForm.holder.trim().split(/\s+/).length >= 2 ? 'border-emerald-400 focus:ring-emerald-300' : 'border-border focus:ring-ring'}`}/>
                      {cardErrors.holder && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11}/>{cardErrors.holder}</p>}
                    </div>
                    {/* Expiry + CVV */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Expiry</label>
                        <input value={cardForm.expiry}
                          onChange={e=>setCardForm({...cardForm,expiry:formatExpiry(e.target.value)})}
                          placeholder="MM/YY" maxLength={5} required
                          className={`w-full px-3 py-2.5 rounded-xl border bg-card text-foreground text-sm focus:outline-none focus:ring-2 font-mono transition
                            ${cardErrors.expiry ? 'border-red-400 focus:ring-red-300' : cardForm.expiry.length===5 && expiryValid(cardForm.expiry) ? 'border-emerald-400 focus:ring-emerald-300' : 'border-border focus:ring-ring'}`}/>
                        {cardErrors.expiry && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11}/>{cardErrors.expiry}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">CVV</label>
                        <input value={cardForm.cvv} type="password"
                          onChange={e=>setCardForm({...cardForm,cvv:e.target.value.replace(/\D/g,'').slice(0,4)})}
                          placeholder="•••" maxLength={4} required
                          className={`w-full px-3 py-2.5 rounded-xl border bg-card text-foreground text-sm focus:outline-none focus:ring-2 font-mono transition
                            ${cardErrors.cvv ? 'border-red-400 focus:ring-red-300' : cardForm.cvv && /^\d{3,4}$/.test(cardForm.cvv) ? 'border-emerald-400 focus:ring-emerald-300' : 'border-border focus:ring-ring'}`}/>
                        {cardErrors.cvv && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11}/>{cardErrors.cvv}</p>}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShieldCheck size={11}/> Your card details are encrypted and never stored.
                    </p>
                  </div>
                )}

                {/* UPI */}
                {payMethod==='upi' && (
                  <div className="p-4 rounded-xl border border-border bg-muted/50 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <ShieldCheck size={12}/> UPI Details
                    </p>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">UPI ID</label>
                      <input
                        value={upiId}
                        onChange={e => setUpiId(e.target.value.trim())}
                        placeholder="yourname@okaxis"
                        required
                        className={`w-full px-3 py-2.5 rounded-xl border bg-card text-foreground text-sm focus:outline-none focus:ring-2 transition
                          ${upiError
                            ? 'border-red-400 focus:ring-red-300'
                            : upiId && upiValid(upiId)
                              ? 'border-emerald-400 focus:ring-emerald-300'
                              : 'border-border focus:ring-ring'
                          }`}
                      />
                      {/* inline error */}
                      {upiError && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={11}/> {upiError}
                        </p>
                      )}
                      {/* inline success */}
                      {upiId && upiValid(upiId) && (
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                          <CheckCircle size={11}/> Valid UPI ID
                        </p>
                      )}
                      {/* format hint when empty */}
                      {!upiId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Format: <span className="font-medium">name@okaxis</span> · name@ybl · name@paytm
                        </p>
                      )}
                    </div>

                    {/* Accepted UPI apps */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Accepted apps</p>
                      <div className="flex gap-3">
                        {[
                          { name: 'GPay',    suffix: '@okicici / @oksbi' },
                          { name: 'PhonePe', suffix: '@ybl' },
                          { name: 'Paytm',   suffix: '@paytm' },
                          { name: 'BHIM',    suffix: '@upi' },
                        ].map(app => (
                          <button
                            type="button"
                            key={app.name}
                            onClick={() => {
                              // auto-fill suffix hint so user knows what to type
                              setUpiId('');
                            }}
                            title={`e.g. yourname${app.suffix}`}
                            className="flex flex-col items-center gap-1 group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center group-hover:border-indigo-300 transition">
                              <Smartphone size={16} className="text-indigo-500"/>
                            </div>
                            <span className="text-xs text-muted-foreground">{app.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Wallet reminder */}
                {payMethod==='wallet' && (
                  <div className={`p-4 rounded-xl border flex items-start gap-3
                    ${walletBalance>=(selectedDoctor?.consultationFee??0)?'bg-emerald-50 border-emerald-200':'bg-red-50 border-red-200'}`}>
                    <Wallet size={18} className={walletBalance>=(selectedDoctor?.consultationFee??0)?'text-emerald-600 mt-0.5':'text-red-500 mt-0.5'} />
                    <div>
                      <p className={`text-sm font-semibold ${walletBalance>=(selectedDoctor?.consultationFee??0)?'text-emerald-800':'text-red-700'}`}>
                        {walletBalance>=(selectedDoctor?.consultationFee??0)?'Sufficient balance':'Insufficient balance'}
                      </p>
                      <p className="text-xs mt-0.5 text-muted-foreground">
                        Available: <span className="font-bold">${walletBalance}</span>
                        {' '}· Required: <span className="font-bold">${selectedDoctor?.consultationFee}</span>
                        {walletBalance<(selectedDoctor?.consultationFee??0) && (
                          <span className="text-red-500 ml-1">— Please top up your wallet first.</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={()=>{setStep('details');setPayError('');}}
                    className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition text-sm flex items-center justify-center gap-1">
                    <ChevronLeft size={16}/> Back
                  </button>
                  <button type="submit"
                    disabled={payButtonDisabled}
                    className="flex-1 py-2.5 rounded-xl text-white font-semibold transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
                    Pay ${selectedDoctor?.consultationFee} <ArrowRight size={16}/>
                  </button>
                </div>
              </form>
            )}

            {/* ═══════════════════════════════════════════════
                STEP 3 — PROCESSING
            ═══════════════════════════════════════════════ */}
            {step==='processing' && (
              <div className="p-10 flex flex-col items-center justify-center gap-6 min-h-[320px]">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"/>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CreditCard size={24} className="text-indigo-600"/>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">Processing Payment</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {payMethod==='wallet' && 'Deducting from your wallet…'}
                    {payMethod==='credit_card' && 'Charging your credit card…'}
                    {payMethod==='debit_card' && 'Charging your debit card…'}
                    {payMethod==='upi' && 'Waiting for UPI confirmation…'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">Please do not close this window</p>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                STEP 4 — RECEIPT
            ═══════════════════════════════════════════════ */}
            {step==='receipt' && receipt && (
              <div className="p-6 space-y-5">
                {/* Success banner */}
                <div className="flex flex-col items-center gap-3 py-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle size={36} className="text-emerald-500"/>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">Payment Successful!</p>
                    <p className="text-sm text-muted-foreground mt-1">Your appointment has been booked and is pending doctor confirmation.</p>
                  </div>
                </div>

                {/* Receipt card */}
                <div className="rounded-2xl border-2 border-dashed border-border overflow-hidden">
                  {/* Receipt header */}
                  <div className="px-5 py-4 text-white text-center"
                    style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
                    <Receipt size={20} className="mx-auto mb-1 opacity-80"/>
                    <p className="font-bold text-lg">Payment Receipt</p>
                    <p className="text-indigo-200 text-xs mt-0.5">
                      {new Date(receipt.payment.paidAt).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'})}
                    </p>
                  </div>

                  {/* Receipt rows */}
                  <div className="divide-y divide-border">
                    {[
                      {label:'Transaction Ref', value: receipt.payment.transactionRef, mono:true, copyable:true},
                      {label:'Doctor',          value: receipt.appointment.doctorName},
                      {label:'Specialization',  value: receipt.appointment.specialization},
                      {label:'Appointment Date',value: `${receipt.appointment.date} at ${receipt.appointment.time}`},
                      {label:'Payment Method',  value: PAYMENT_METHODS.find(m=>m.id===receipt.payment.method)?.label ?? receipt.payment.method},
                      {label:'Paid With',       value: receipt.payment.methodDetails},
                      {label:'Status',          value: 'Confirmed', green:true},
                    ].map(row=>(
                      <div key={row.label} className="flex items-center justify-between px-5 py-3">
                        <span className="text-xs text-muted-foreground">{row.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-medium text-right max-w-[200px] truncate
                            ${row.green?'text-emerald-600':'text-foreground'} ${row.mono?'font-mono text-xs':''}`}>
                            {row.value}
                          </span>
                          {row.copyable && (
                            <button type="button" onClick={copyRef}
                              className="text-muted-foreground hover:text-indigo-600 transition flex-shrink-0">
                              <Copy size={13}/>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* Amount row */}
                    <div className="flex items-center justify-between px-5 py-4 bg-indigo-50">
                      <span className="text-sm font-bold text-indigo-800">Amount Paid</span>
                      <span className="text-2xl font-bold text-indigo-700">${receipt.payment.amount}</span>
                    </div>
                  </div>
                </div>

                {copied && (
                  <p className="text-xs text-center text-emerald-600 font-medium">
                    ✓ Transaction reference copied!
                  </p>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={resetModal}
                    className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition text-sm">
                    Close
                  </button>
                  <button type="button" onClick={()=>{resetModal(); setActiveTab('pending');}}
                    className="flex-1 py-2.5 rounded-xl text-white font-semibold transition text-sm"
                    style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
                    View Appointments
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
