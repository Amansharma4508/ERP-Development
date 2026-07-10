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

export default function WalletPage() {
  const { token } = useAuth();
  const [balance, setBalance]           = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments]         = useState<PaymentRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<ActiveTab>('transactions');
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

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-48 rounded-2xl"/>
          <div className="skeleton h-64 rounded-2xl"/>
        </div>
      ) : (
        <>
          {/* Balance card */}
          <div className="rounded-2xl p-8 text-white relative overflow-hidden"
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
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
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
          </div>

          {/* Tabs: Transactions | Payment History */}
          <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
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
          </div>

          {/* ── TRANSACTIONS TAB ── */}
          {activeTab==='transactions' && (
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
          )}

          {/* ── PAYMENT HISTORY TAB ── */}
          {activeTab==='payments' && (
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
                            {/* method icon */}
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
          )}
        </>
      )}

      {/* Top Up Modal */}
      {showTopUp && (
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
      )}
    </div>
  );
}
