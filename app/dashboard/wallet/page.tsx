'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  User,
  Clock,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  PackageCheck,
  Truck,
  Home,
  Lock,
} from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  mode: 'online' | 'offline';
  description: string;
  created_at: string;
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
  amount_given: number;
  amount_used: number;
  remaining_balance: number;
  transactions: Transaction[];
  delivery_status: 'processing' | 'printed' | 'dispatched' | 'out_for_delivery' | 'delivered';
  delivery_updated_at: string | null;
}

// Physical card delivery ke stages — DB ke delivery_status column se match karte hain
const DELIVERY_STAGES = [
  { key: 'processing', label: 'Approved', icon: CheckCircle },
  { key: 'printed', label: 'Card Printed', icon: Printer },
  { key: 'dispatched', label: 'Dispatched', icon: PackageCheck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
] as const;

function getStageIndex(status: string | undefined) {
  const idx = DELIVERY_STAGES.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function DeliveryTracker({
  deliveryStatus,
  updatedAt,
}: {
  deliveryStatus: CardData['delivery_status'];
  updatedAt: string | null;
}) {
  const currentIndex = getStageIndex(deliveryStatus);
  const isDelivered = deliveryStatus === 'delivered';

  return (
    <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h4 className="text-sm font-bold text-foreground">Physical Card Delivery Status</h4>
        {updatedAt && (
          <span className="text-[11px] text-muted-foreground">
            Last updated: {new Date(updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between relative">
        {/* Connecting line track */}
        <div className="absolute top-4 left-0 right-0 h-[3px] bg-border" style={{ marginLeft: '1.25rem', marginRight: '1.25rem' }} />
        <div
          className="absolute top-4 left-0 h-[3px] bg-emerald-500 transition-all duration-500"
          style={{
            marginLeft: '1.25rem',
            width: `calc(${(currentIndex / (DELIVERY_STAGES.length - 1)) * 100}% - 2.5rem * ${currentIndex / (DELIVERY_STAGES.length - 1)})`,
          }}
        />

        {DELIVERY_STAGES.map((stage, idx) => {
          const StageIcon = stage.icon;
          const isDone = idx < currentIndex || (isDelivered && idx === currentIndex);
          const isCurrent = idx === currentIndex && !isDelivered;

          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center flex-1 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors
                  ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : ''}
                  ${isCurrent ? 'bg-white dark:bg-card border-blue-600 text-blue-600 animate-pulse' : ''}
                  ${!isDone && !isCurrent ? 'bg-white dark:bg-card border-border text-muted-foreground' : ''}
                `}
              >
                <StageIcon size={14} />
              </div>
              <span
                className={`mt-2 text-[10px] font-semibold text-center leading-tight px-0.5
                  ${isDone ? 'text-emerald-600' : isCurrent ? 'text-blue-600' : 'text-muted-foreground'}
                `}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { token } = useAuth();
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [showRecentApprovalBanner, setShowRecentApprovalBanner] = useState(false);

  const fetchHealthCard = useCallback(async () => {
    if (!token) {
      setCardLoading(false);
      return;
    }

    try {
      setCardLoading(true);
      const response = await fetch('/api/health-card', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCardData(data.data);

        const statusCheck = (data.data.status || '').toLowerCase();
        if (statusCheck === 'approved' || statusCheck === 'active') {
          const approvalKey = `approved_banner_seen_${data.data.card_number || 'user'}`;
          const bannerSeenTime = sessionStorage.getItem(approvalKey);
          const now = new Date().getTime();

          if (!bannerSeenTime) {
            sessionStorage.setItem(approvalKey, now.toString());
            setShowRecentApprovalBanner(true);
          } else {
            const elapsedMinutes = (now - parseInt(bannerSeenTime)) / (1000 * 60);
            if (elapsedMinutes < 20) {
              setShowRecentApprovalBanner(true);
            } else {
              setShowRecentApprovalBanner(false);
            }
          }
        }
      } else {
        setCardData(null);
      }
    } catch (err) {
      console.error('Health card fetch failed:', err);
      setCardData(null);
    } finally {
      setCardLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHealthCard();
  }, [fetchHealthCard]);

  // Application abhi tak review mein hai (admin approval pending)
  const renderStatusBanner = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'approved' || statusLower === 'active') {
      return null;
    }

    return (
      <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-amber-700 dark:text-amber-400">
        <Clock size={20} className="shrink-0 text-amber-500 animate-pulse" />
        <div className="text-sm">
          <span className="font-semibold block">Card Under Verification / Progress</span>
          <span>Your Health ID application is currently under review by the administration. It will be fully active soon.</span>
        </div>
      </div>
    );
  };

  const isApproved = ['approved', 'active'].includes((cardData?.status || '').toLowerCase());
  const isPhysicallyDelivered = cardData?.delivery_status === 'delivered';
  const showDeliveryLockWarning = isApproved && !isPhysicallyDelivered;

  return (
    <div className="space-y-6">
      {/* 20-Minute Temporary Top Approval Alert Banner */}
      {showRecentApprovalBanner && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="shrink-0 text-white" />
            <div>
              <span className="font-bold block text-sm">Congratulations! 🎉</span>
              <span className="text-xs text-emerald-100">Your Health ID card has been successfully approved by the admin side.</span>
            </div>
          </div>
          <button onClick={() => setShowRecentApprovalBanner(false)} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallet & Health ID</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your health card, balance, and transaction history.</p>
        </div>

        {/* Wallet Balance Widget */}
        {cardData && (
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-5 rounded-2xl text-white shadow-lg w-full sm:w-80 relative overflow-hidden">
            {showDeliveryLockWarning && (
              <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-[1px] flex items-center justify-center gap-2 text-xs font-semibold">
                <Lock size={14} />
                Locked until card delivery
              </div>
            )}
            <p className="text-[11px] uppercase tracking-wider text-white/80 font-medium">Available Wallet Balance</p>
            <h2 className="text-3xl font-extrabold mt-1">
              ₹ {cardData?.remaining_balance?.toLocaleString() || cardData?.amount_given?.toLocaleString() || '35,000'}
            </h2>
            <div className="mt-3 flex items-center justify-between text-[11px] text-white/90 border-t border-white/20 pt-2">
              <span>Allocated: ₹ {cardData?.amount_given?.toLocaleString() || '35,000'}</span>
              <span>Used: ₹ {cardData?.amount_used?.toLocaleString() || '0'}</span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        {cardLoading ? (
          <div className="max-w-4xl mx-auto py-4">
            <div className="animate-pulse h-48 bg-muted rounded-2xl" />
          </div>
        ) : !cardData ? (
          <div className="text-center py-16">
            <p className="font-semibold text-foreground">No health card found</p>
            <p className="text-sm text-muted-foreground mt-1">Your health card details are not available yet.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 justify-items-left mx-auto py-4">
              {/* FRONT CARD */}
              <div className="w-full max-w-[380px] aspect-[1.586/1] rounded-2xl p-4 text-white flex flex-col justify-between shadow-md relative overflow-hidden select-none"
                   style={{ background: 'linear-gradient(135deg, #063c31 0%, #0c2340 50%, #1d4ed8 100%)' }}>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[11px] font-bold tracking-widest text-emerald-300">SVABHIMAN HEALTH ID CARD</span>
                </div>
                <div className="flex gap-4 items-center my-auto">
                  <div className="w-20 h-24 rounded-lg bg-slate-900/40 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden bg-muted">
                    {cardData.live_photo_url ? (
                      <img src={cardData.live_photo_url} alt="Applicant" className="w-full h-full object-cover" />
                    ) : (
                      <User size={36} className="text-white/30" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div>
                      <span className="text-[8px] uppercase tracking-wide text-white/50 block">Name</span>
                      <p className="text-sm font-bold text-white truncate">{cardData.full_name || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-wide text-white/50 block">DOB</span>
                      <p className="text-[11px] font-semibold text-white">{cardData.dob || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-wide text-white/50 block">Card Number</span>
                      <p className="text-xs font-bold tracking-wider text-emerald-300">{cardData.card_number || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right self-center shrink-0">
                    <span className="text-[8px] uppercase tracking-wide text-white/50 block">Blood</span>
                    <p className="text-xs font-bold text-red-400">{cardData.blood_group || '—'}</p>
                  </div>
                </div>
              </div>

              {/* BACK CARD */}
              <div className="w-full max-w-[380px] aspect-[1.586/1] rounded-2xl bg-white border border-slate-200 text-slate-800 flex flex-col justify-between shadow-md overflow-hidden select-none">
                <div className="w-full h-10 bg-[#0f172a] mt-4 shrink-0" />
                <div className="p-4 grid grid-cols-2 gap-x-2 gap-y-3 text-left my-auto">
                  <div className="col-span-2">
                    <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 block">Permanent Address</span>
                    <p className="text-[10px] font-medium text-slate-700 leading-tight">
                      {`${cardData.house_number || ''}, Ward ${cardData.ward_number || ''}, ${cardData.village_city || ''}, ${cardData.district || ''}, ${cardData.state || ''} - ${cardData.pin_code || ''}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 block">Head of Family</span>
                    <p className="text-[11px] font-bold text-slate-700">{cardData.head_of_family || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 block">Center Code</span>
                    <p className="text-[11px] font-bold text-slate-700">{cardData.area_code || '—'}</p>
                  </div>
                </div>
                <div className="bg-slate-50 border-t border-slate-100 py-1.5 text-center">
                  <span className="text-[8px] text-slate-400 font-medium">If found, please return to the nearest center.</span>
                </div>
              </div>
            </div>

            {/* Application under-review banner (only when not yet approved) */}
            {renderStatusBanner(cardData.status)}

            {/* Physical delivery tracker — sirf tab dikhega jab application approved ho chuki ho */}
            {isApproved && (
              <DeliveryTracker deliveryStatus={cardData.delivery_status} updatedAt={cardData.delivery_updated_at} />
            )}

            {/* Lock warning: physical card delivery hone tak transactions use nahi ho sakte */}
            {showDeliveryLockWarning && (
              <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-700 dark:text-red-400">
                <Lock size={20} className="shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold block">Wallet Locked — Physical Card Pending</span>
                  <span className="text-red-700/90 dark:text-red-400/90">
                    You can start using your wallet balance for transactions only after your physical Health ID card is delivered to you.
                    Track the delivery progress above — you'll be notified once it's on its way.
                  </span>
                </div>
              </div>
            )}

            {isPhysicallyDelivered && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                <CheckCircle size={20} className="shrink-0" />
                <div className="text-sm">
                  <span className="font-semibold block">Card Delivered — Wallet Active</span>
                  <span>Your physical card has been delivered. You can now use your wallet balance for transactions.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction History Section */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground">Transaction History (Online & Offline)</h3>

        {!cardData?.transactions || cardData.transactions.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No recent transactions found in your wallet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Type / Mode</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cardData.transactions.map((tx) => {
                  const isCredit = tx.type === 'credit';
                  return (
                    <tr key={tx.id} className="hover:bg-muted/50 transition">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${isCredit ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                          {isCredit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                        </span>
                        <div>
                          <span className="font-bold capitalize block text-foreground">{tx.type}</span>
                          <span className="text-[10px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{tx.mode}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium">{tx.description || 'Medical Transaction'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</td>
                      <td className={`py-3 px-4 text-right font-bold ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isCredit ? '+' : '-'} ₹ {Number(tx.amount).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}