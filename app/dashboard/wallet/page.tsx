'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, Plus, CheckCircle, XCircle,
  AlertCircle, X, CreditCard, Wallet, Smartphone, Receipt,
  TrendingUp, TrendingDown, History, User
} from 'lucide-react';
import WalletOnboardingForm from '@/components/wallet-onboarding-form';

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

interface CardData {
  full_name: string;
  father_name: string;
  mother_name: string;
  dob: string;
  gender: string;
  blood_group: string;
  house_number: string;
  ward_number: string;
  village_city: string;
  gram_panchayat: string;
  block: string;
  district: string;
  state: string;
  pin_code: string;
  head_of_family: string;
  area_code: string;
  live_photo_url: string | null;
  card_number: string;
  status: string;
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

export default function WalletPage() {
  const { token, user, walletOnboardingStatus, setWalletOnboardingStatus } = useAuth();
  const [balance, setBalance]           = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments]         = useState<PaymentRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<ActiveTab>('transactions');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [toast, setToast]               = useState<{msg:string;type:'success'|'error'}|null>(null);

  // Health card ka real data
  const [cardData, setCardData]         = useState<CardData | null>(null);
  const [cardLoading, setCardLoading]   = useState(true);

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

function mapDbStatusToOnboardingStatus(dbStatus: string): WalletOnboardingStatus {
  switch (dbStatus) {
    case 'submitted':
      return 'in-progress';   // form submit ho chuka, review pending
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'none';          // ya chaho to alag handle karo
    default:
      return 'none';
  }
}

const fetchHealthCard = useCallback(async () => {
  if (!token) return;
  try {
    const res  = await fetch('/api/health-card', { headers:{ Authorization:`Bearer ${token}` } });
    const data = await res.json();
    if (data.success) {
      setCardData(data.data);
      if (data.data.status) {
        setWalletOnboardingStatus(mapDbStatusToOnboardingStatus(data.data.status));
      }
    } else {
      setCardData(null);
      setWalletOnboardingStatus('none'); // application hi nahi mili
    }
  } catch (err) {
    console.error('Health card fetch failed:', err);
  } finally {
    setCardLoading(false);
  }
}, [token, setWalletOnboardingStatus]);

  useEffect(() => { fetchWallet(); fetchPayments(); }, [fetchWallet, fetchPayments]);
  useEffect(() => { fetchHealthCard(); }, [fetchHealthCard]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type==='success'?'bg-emerald-500':'bg-red-500'}`}>
          {toast.type==='success'?<CheckCircle size={16}/>:<XCircle size={16}/>} {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your balance and payment history</p>
      </div>

      {/* ── CONDITION: IF ONBOARDING IS IN PROGRESS OR PENDING ── */}
      {user?.role === 'user' && (walletOnboardingStatus === 'pending' || walletOnboardingStatus === 'in-progress') ? (
        <div className="space-y-6">

          {/* 1. HEALTH CARD PREVIEW VIEW BLOCK */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-5 mb-6">
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 block mb-1">Health Card View</span>
              <h2 className="text-xl font-bold text-slate-800">Patient Verification Card</h2>
              <p className="text-xs text-muted-foreground mt-0.5">A dedicated health-card style page for secure document review, patient details, and printing.</p>
            </div>

            {cardLoading ? (
              <div className="max-w-4xl mx-auto py-4">
                <div className="skeleton h-48 rounded-2xl" />
              </div>
            ) : (
              /* Live Cards Design Grid */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 justify-items-left mx-auto py-4">

                {/* FRONT CARD DESIGN */}
                <div className="w-full max-w-[380px] aspect-[1.586/1] rounded-2xl p-4 text-white flex flex-col justify-between shadow-md relative overflow-hidden select-none"
                     style={{ background: 'linear-gradient(135deg, #063c31 0%, #0c2340 50%, #1d4ed8 100%)' }}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-6 translate-x-6 pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-[11px] font-bold tracking-widest text-emerald-300">SVABHIMAN HEALTH ID CARD</span>
                  </div>

                  {/* Body Content */}
                  <div className="flex gap-4 items-center my-auto">
                    {/* Profile Pic */}
                    <div className="w-20 h-24 rounded-lg bg-slate-900/40 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden bg-muted">
                      {cardData?.live_photo_url ? (
                        <img src={cardData.live_photo_url} alt="Applicant" className="w-full h-full object-cover" />
                      ) : (
                        <User size={36} className="text-white/30" />
                      )}
                    </div>

                    {/* Patient Info Fields */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div>
                        <span className="text-[8px] uppercase tracking-wide text-white/50 block">Name</span>
                        <p className="text-sm font-bold text-white truncate">{cardData?.full_name || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase tracking-wide text-white/50 block">DOB</span>
                        <p className="text-[11px] font-semibold text-white">{cardData?.dob || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase tracking-wide text-white/50 block">Card Number</span>
                        <p className="text-xs font-bold tracking-wider text-emerald-300">{cardData?.card_number || '—'}</p>
                      </div>
                    </div>

                    {/* Blood Group Flag */}
                    <div className="text-right self-center shrink-0">
                      <span className="text-[8px] uppercase tracking-wide text-white/50 block">Blood</span>
                      <p className="text-xs font-bold text-red-400">{cardData?.blood_group || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* BACK CARD DESIGN */}
                <div className="w-full max-w-[380px] aspect-[1.586/1] rounded-2xl bg-white border border-slate-200 text-slate-800 flex flex-col justify-between shadow-md overflow-hidden select-none">
                  {/* Magnetic Stripe */}
                  <div className="w-full h-10 bg-[#0f172a] mt-4 shrink-0" />

                  {/* Card Details Area */}
                  <div className="p-4 grid grid-cols-2 gap-x-2 gap-y-3 text-left my-auto">
                    <div className="col-span-2">
                      <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 block">Permanent Address</span>
                      <p className="text-[10px] font-medium text-slate-700 leading-tight">
                        {cardData
                          ? `${cardData.house_number}, Ward ${cardData.ward_number}, ${cardData.village_city}, ${cardData.gram_panchayat}, ${cardData.block}, ${cardData.district}, ${cardData.state} - ${cardData.pin_code}`
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 block">Head of Family</span>
                      <p className="text-[11px] font-bold text-slate-700">{cardData?.head_of_family || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 block">Center Code</span>
                      <p className="text-[11px] font-bold text-slate-700">{cardData?.area_code || '—'}</p>
                    </div>
                  </div>

                  {/* Footer instructions */}
                  <div className="bg-slate-50 border-t border-slate-100 py-1.5 text-center">
                    <span className="text-[8px] text-slate-400 font-medium">If found, please return to the nearest center.</span>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* 2. PROGRESS TEXT BLOCK */}
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800">Your wallet is in progress</h3>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed font-medium">
              Your onboarding details are being reviewed. Wallet balance, top-up actions, and related shortcuts stay hidden until approval.
            </p>
          </div>

        </div>
      ) : !showApplicationForm ? (
        /* Default view for normal status */
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-2xl bg-teal-100 p-3 text-teal-700">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Savibhiman Wallet</p>
              <p className="text-sm text-muted-foreground font-medium">A secure and simple wallet for digital payments.</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground font-medium pb-4">
            SVABHIMAN, the flagship healthcare arm of CDC India&apos;s Project SWABHIMAN, is an integrated, multi-tier healthcare ecosystem engineered to redefine medical access...
          </p>

          <button
            type="button"
            onClick={() => setShowApplicationForm(true)}
            className="inline-flex items-center justify-center rounded-3xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Apply Now
          </button>
        </div>
      ) : (
        <WalletOnboardingForm onSubmitted={() => { setShowApplicationForm(false); setWalletOnboardingStatus('in-progress'); }} />
      )}

      {/* Loading State */}
      {loading && !walletOnboardingStatus && (
        <div className="space-y-4">
          <div className="skeleton h-48 rounded-2xl"/>
        </div>
      )}
    </div>
  );
}