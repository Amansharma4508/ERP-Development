'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, Plus, CheckCircle, XCircle,
  AlertCircle, X, CreditCard, Wallet, Smartphone, Receipt,
  TrendingUp, TrendingDown, History,
} from 'lucide-react';

interface Transaction {
  id: string; type: 'credit' | 'debit';
  amount: number; description: string; category: string; date: string;
}

interface PaymentRecord {
  id: string; appointmentId: string; amount: number;
  method: 'wallet' | 'credit_card' | 'debit_card' | 'upi';
  methodDetails: string; status: string;
  transactionRef: string; paidAt: string;
}

type ActiveTab = 'transactions' | 'payments';

const METHOD_LABEL: Record<string, string> = {
  wallet: 'Wallet', credit_card: 'Credit Card',
  debit_card: 'Debit Card', upi: 'UPI',
};

const METHOD_ICON: Record<string, any> = {
  wallet: Wallet, credit_card: CreditCard,
  debit_card: CreditCard, upi: Smartphone,
};

const METHOD_COLOR: Record<string, string> = {
  wallet:      'bg-indigo-100 text-indigo-600',
  credit_card: 'bg-violet-100 text-violet-600',
  debit_card:  'bg-blue-100 text-blue-600',
  upi:         'bg-emerald-100 text-emerald-600',
};

function CardApplicationForm() {
  const [form, setForm] = useState({
    fullName: '', fatherName: '', motherName: '', email: '', password: '',
    dob: '', gender: 'female', qualification: '', district: '', state: '', pinCode: '',
    centerAssigned: 'S1', consentGiven: false,
  });
  const [loadingForm, setLoadingForm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const canSubmit = [
    form.fullName, form.fatherName, form.motherName,
    form.email, form.password, form.district, form.state, form.pinCode,
  ].every((value) => value.trim().length > 0) && form.password.length >= 6 && form.consentGiven;

  const updateField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!canSubmit) {
      setFormError('Fill all required fields and accept consent before applying.');
      return;
    }

    setLoadingForm(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'wallet_user' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Unable to submit the wallet application.');
      } else {
        setIsSubmitted(true);
        setSuccessMessage('Your wallet details have been submitted successfully and are now under review.');
        setForm({
          fullName: '', fatherName: '', motherName: '', email: '', password: '',
          dob: '', gender: 'female', qualification: '', district: '', state: '', pinCode: '',
          centerAssigned: 'S1', consentGiven: false,
        });
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-sm font-semibold text-foreground">Apply for Wallet Card</p>
          <p className="text-xs text-muted-foreground">Submit your card application from your wallet page.</p>
        </div>
        <span className="rounded-full bg-teal-100 px-3 py-1 text-[11px] font-semibold text-teal-700">Wallet page</span>
      </div>

      {isSubmitted ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold ">Your wallet details have been submitted successfully</p>
                <p className="mt-1 text-sm text-emerald-700/80 font-medium">{successMessage}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className='font-medium font-muted-foreground'>Your Savibhiman Wallet card is now being processed and will be updated.</p>
            <p className="mt-1 font-medium font-muted-foreground">You will see the status once your wallet card is in progress.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={submitForm} className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Full Name *', key: 'fullName', type: 'text' },
              { label: 'Father’s Name *', key: 'fatherName', type: 'text' },
              { label: 'Mother’s Name *', key: 'motherName', type: 'text' },
              { label: 'Email *', key: 'email', type: 'email' },
              { label: 'Password *', key: 'password', type: 'password' },
              { label: 'DOB', key: 'dob', type: 'date' },
            ].map((field) => (
              <label key={field.key} className="block">
                <span className="text-sm font-medium text-foreground">{field.label}</span>
                <input
                  type={field.type}
                  value={(form as any)[field.key]}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-foreground">Gender</span>
              <select
                value={form.gender}
                onChange={(event) => updateField('gender', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >
                {['female', 'male', 'other'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Center Assigned</span>
              <select
                value={form.centerAssigned}
                onChange={(event) => updateField('centerAssigned', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >
                {['S1', 'S2', 'S3', 'DHS'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Qualification</span>
              <input
                type="text"
                value={form.qualification}
                onChange={(event) => updateField('qualification', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-foreground">State *</span>
              <input
                type="text"
                value={form.state}
                onChange={(event) => updateField('state', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">District *</span>
              <input
                type="text"
                value={form.district}
                onChange={(event) => updateField('district', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">PIN Code *</span>
              <input
                type="text"
                value={form.pinCode}
                onChange={(event) => updateField('pinCode', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </label>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.consentGiven}
              onChange={(event) => updateField('consentGiven', event.target.checked)}
              className="h-4 w-4 rounded border-border text-teal-600 focus:ring-teal-500"
            />
            I consent to wallet application and data processing
          </label>
          {formError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
          <button
            type="submit"
            disabled={loadingForm || !canSubmit}
            className="inline-flex items-center justify-center rounded-3xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loadingForm ? 'Applying...' : 'Submit Wallet Application'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function WalletPage() {
  const { token } = useAuth();
  const [balance, setBalance]           = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments]         = useState<PaymentRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<ActiveTab>('transactions');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showTopUp, setShowTopUp]       = useState(false);
  const [amount, setAmount]             = useState('');
  const [topping, setTopping]           = useState(false);
  const [topUpError, setTopUpError]     = useState('');
  const [txnFilter, setTxnFilter]       = useState<'all'|'credit'|'debit'>('all');
  const [toast, setToast]               = useState<{msg:string;type:'success'|'error'}|null>(null);

  const showToast = (msg:string, type:'success'|'error'='success') => {
    setToast({msg,type}); setTimeout(()=>setToast(null), 3000);
  };

  const fetchWallet = useCallback(async () => {
    if (!token) return;
    const res  = await fetch('/api/wallet', { headers:{ Authorization:`Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { setBalance(data.data.balance); setTransactions(data.data.transactions); }
    setLoading(false);
  }, [token]);

  const fetchPayments = useCallback(async () => {
    if (!token) return;
    const res  = await fetch('/api/payments', { headers:{ Authorization:`Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setPayments(data.data);
  }, [token]);

  useEffect(() => { fetchWallet(); fetchPayments(); }, [fetchWallet, fetchPayments]);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault(); setTopUpError(''); setTopping(true);
    try {
      const res  = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Top-up failed');
      setBalance(data.data.balance);
      setTransactions(prev => [data.data.transaction, ...prev]);
      setShowTopUp(false); setAmount('');
      showToast(`$${Number(amount).toLocaleString()} added to your wallet!`);
    } catch(err:any) { setTopUpError(err.message); }
    finally { setTopping(false); }
  };

  const filtered     = txnFilter==='all' ? transactions : transactions.filter(t=>t.type===txnFilter);
  const totalCredit  = transactions.filter(t=>t.type==='credit').reduce((s,t)=>s+t.amount, 0);
  const totalDebit   = transactions.filter(t=>t.type==='debit').reduce((s,t)=>s+t.amount, 0);
  const QUICK        = [100, 250, 500, 1000];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in-up flex items-center gap-2
          ${toast.type==='success'?'bg-emerald-500':'bg-red-500'}`}>
          {toast.type==='success'?<CheckCircle size={16}/>:<XCircle size={16}/>} {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your balance and payment history</p>
      </div>

      {!showApplicationForm ? (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-2xl bg-teal-100 p-3 text-teal-700">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Savibhiman Wallet</p>
              <p className="text-sm text-muted-foreground font-medium">A secure and simple wallet for everyday digital payments and account management.</p>
            </div>
            
          </div>
          <div>
             <p className="text-sm text-muted-foreground font-medium pb-4">SVABHIMAN , the flagship healthcare arm of CDC India’s Project SWABHIMAN, is an integrated, multi-tier healthcare ecosystem engineered to redefine medical access, delivery, and affordability. operating on a highly specialised architecture of Deep Blue (representing trust and stability), *Vital Gold* (representing premium quality and prosperity), and Clinical White (representing absolute hygiene), our centers are transforming the healthcare landscape of India from the village level to mega-metropolitan standards.</p>

            </div>

          <div className="grid gap-3 md:grid-cols-2 mb-5">
            {[
              'Fast and secure wallet payments',
              'Track balance and transactions in one place',
              'Easy top-ups with quick fund transfers',
              'Support for family and center-based services',
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-2 rounded-2xl border border-border bg-muted/50 px-3 py-3 text-sm text-foreground">
                <CheckCircle size={16} className="mt-0.5 shrink-0 text-teal-600" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowApplicationForm(true)}
            className="inline-flex items-center justify-center rounded-3xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Apply Now
          </button>
        </div>
      ) : (
        <CardApplicationForm />
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-48 rounded-2xl"/>
          <div className="skeleton h-64 rounded-2xl"/>
        </div>
      ) : (
        <>
          {/* Balance card */}
          {/* <div className="rounded-2xl p-8 text-white relative overflow-hidden"
            style={{background:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#a78bfa 100%)'}}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 bg-white"/>
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 translate-y-1/2 -translate-x-1/2 bg-white"/>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-white/70 text-sm font-medium mb-2">
                <CreditCard size={16}/> Available Balance
              </div>
              <p className="text-5xl font-bold mb-6">
                ${balance.toLocaleString()}<span className="text-xl text-white/60">.00</span>
              </p>
              <div className="flex flex-wrap gap-6 mb-6">
                <div>
                  <p className="text-white/60 text-xs">Total Credited</p>
                  <p className="text-lg font-semibold text-emerald-300 flex items-center gap-1">
                    <ArrowDownLeft size={16}/>+${totalCredit.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Total Spent</p>
                  <p className="text-lg font-semibold text-red-300 flex items-center gap-1">
                    <ArrowUpRight size={16}/>-${totalDebit.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Payments Made</p>
                  <p className="text-lg font-semibold text-white flex items-center gap-1">
                    <Receipt size={16}/>{payments.length}
                  </p>
                </div>
              </div>
              <button onClick={()=>setShowTopUp(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition backdrop-blur border border-white/30">
                <Plus size={16}/> Top Up Wallet
              </button>
            </div>
          </div> */}

          {/* Summary stats */}
          {/* <div className="grid grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Transactions</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{transactions.filter(t=>t.type==='credit').length}</p>
              <p className="text-xs text-emerald-600 mt-1">Credits</p>
            </div>
            <div className="bg-red-50 rounded-2xl border border-red-100 p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{transactions.filter(t=>t.type==='debit').length}</p>
              <p className="text-xs text-red-600 mt-1">Debits</p>
            </div>
          </div> */}

          {/* Tabs: Transactions | Payment History */}
          {/* <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
            <button onClick={()=>setActiveTab('transactions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
                ${activeTab==='transactions'?'bg-white shadow text-foreground':'text-muted-foreground hover:text-foreground'}`}>
              <TrendingUp size={14}/> Transactions
            </button>
            <button onClick={()=>setActiveTab('payments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
                ${activeTab==='payments'?'bg-white shadow text-foreground':'text-muted-foreground hover:text-foreground'}`}>
              <History size={14}/> Payment History
              {payments.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">{payments.length}</span>
              )}
            </button>
          </div> */}

          {/* ── TRANSACTIONS TAB ── */}
          {/* {activeTab==='transactions' && (
            <div className="bg-card rounded-2xl border border-border">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-semibold text-foreground">Transaction History</h3>
                <div className="flex gap-1 bg-muted p-1 rounded-xl">
                  {(['all','credit','debit'] as const).map(f=>(
                    <button key={f} onClick={()=>setTxnFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize
                        ${txnFilter===f?'bg-white shadow text-foreground':'text-muted-foreground'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-border">
                {filtered.length===0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard size={36} className="mx-auto mb-2 opacity-20"/>
                    <p className="text-sm">No transactions yet</p>
                  </div>
                ) : filtered.map(txn=>(
                  <div key={txn.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        ${txn.type==='credit'?'bg-emerald-100':'bg-red-100'}`}>
                        {txn.type==='credit'
                          ?<ArrowDownLeft size={18} className="text-emerald-600"/>
                          :<ArrowUpRight  size={18} className="text-red-600"/>}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{txn.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{txn.date}</span>
                          <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-md border border-border">{txn.category}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-base font-bold ${txn.type==='credit'?'text-emerald-600':'text-red-600'}`}>
                      {txn.type==='credit'?'+':'-'}${txn.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )} */}

          {/* ── PAYMENT HISTORY TAB ── */}
          {/* {activeTab==='payments' && (
            <div className="bg-card rounded-2xl border border-border">
              <div className="p-5 border-b border-border">
                <h3 className="font-semibold text-foreground">Appointment Payment History</h3>
                <p className="text-xs text-muted-foreground mt-0.5">All payments made for doctor appointments</p>
              </div>
              {payments.length===0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt size={36} className="mx-auto mb-2 opacity-20"/>
                  <p className="text-sm font-medium">No payments yet</p>
                  <p className="text-xs mt-1">Book an appointment to see payments here.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {payments.map(pmt=>{
                    const MethodIcon = METHOD_ICON[pmt.method] ?? CreditCard;
                    return (
                      <div key={pmt.id} className="px-5 py-4 hover:bg-muted transition">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${METHOD_COLOR[pmt.method]}`}>
                              <MethodIcon size={18}/>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-foreground">
                                  {METHOD_LABEL[pmt.method]}
                                </p>
                                <span className="text-xs text-muted-foreground font-medium">
                                  {pmt.methodDetails}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                  {pmt.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(pmt.paidAt).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'})}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-lg border border-border">
                                  {pmt.transactionRef}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-base font-bold text-red-600 flex-shrink-0">
                            -${pmt.amount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )} */}
        </>
      )}

      {/* Top Up Modal */}
      {/* {showTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Top Up Wallet</h2>
              <button onClick={()=>{setShowTopUp(false);setTopUpError('');setAmount('');}}
                className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition">
                <X size={16}/>
              </button>
            </div>
            <form onSubmit={handleTopUp} className="p-6 space-y-4">
              {topUpError && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle size={15}/> {topUpError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Quick select</label>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK.map(q=>(
                    <button type="button" key={q} onClick={()=>setAmount(String(q))}
                      className={`py-2 rounded-xl text-sm font-semibold border-2 transition
                        ${amount===String(q)?'border-indigo-400 bg-indigo-50 text-indigo-700':'border-border text-muted-foreground hover:border-indigo-300'}`}>
                      ${q}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Or enter amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
                    min={1} max={10000} required
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0"/>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Max $10,000 per top-up</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowTopUp(false);setAmount('');setTopUpError('');}}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={topping||!amount}
                  className="flex-1 py-2.5 rounded-xl text-white font-semibold transition text-sm disabled:opacity-50"
                  style={{background:topping?'#a5b4fc':'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
                  {topping?'Processing…':'Add Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}
    </div>
  );
}
