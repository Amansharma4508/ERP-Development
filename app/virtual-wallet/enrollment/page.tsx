'use client';

import { useAuth } from '@/lib/auth-context';
import { useCallback, useEffect, useState } from 'react';
import {
  UserCheck, CreditCard, Send, ScanLine, CheckCircle2,
  Clock, AlertCircle, MapPin, Calendar, Hash,
} from 'lucide-react';

const STEPS = [
  { key: 'enrolled',     label: 'User Enrollment',        desc: 'Account created and submitted to data center', Icon: UserCheck  },
  { key: 'processing',   label: 'Data Center Process',     desc: 'Identity verification and card generation',    Icon: Clock      },
  { key: 'card_printed', label: 'Card Printed',            desc: 'Physical SWAB card printed with ₹35,000',      Icon: CreditCard },
  { key: 'dispatched',   label: 'Dispatched',              desc: 'Card sent via courier to assigned center',      Icon: Send       },
  { key: 'active',       label: 'Scan & Activation',       desc: 'Scanned at S1 center — wallet now active',      Icon: ScanLine   },
];

const ORDER = ['enrolled','processing','card_printed','dispatched','active'];

export default function EnrollmentPage() {
  const { token } = useAuth();
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) return;
    const res  = await fetch('/api/virtual-wallet', { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-24 rounded-2xl"/>)}</div>;
  if (!data) return null;

  const { user } = data;
  const currentIdx = ORDER.indexOf(user.enrollmentStatus);

  const scanColor: Record<string,string> = {
    verified: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    pending:  'text-amber-600  bg-amber-50  border-amber-200',
    scanned:  'text-blue-600   bg-blue-50   border-blue-200',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Enrollment Status</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your card from enrollment to wallet activation</p>
      </div>

      {/* Card visual */}
      <div className="rounded-2xl p-7 text-white relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg,#0f766e 0%,#0891b2 60%,#0284c7 100%)' }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 -translate-x-1/2 translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <p className="text-white/70 text-xs font-medium tracking-widest uppercase">SWAB Health Card</p>
            <CreditCard size={28} className="text-white/60" />
          </div>
          <p className="text-xl font-mono tracking-widest mb-5">{user.cardNumber}</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/60 text-xs">Card Holder</p>
              <p className="font-semibold">{user.fullName}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">Allocation</p>
              <p className="font-bold text-lg">₹35,000</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detail row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Center Assigned', value: user.centerAssigned, Icon: MapPin    },
          { label: 'Enrolled On',     value: user.enrollmentDate, Icon: Calendar  },
          { label: 'Dispatched On',   value: user.dispatchDate ?? 'Pending',      Icon: Send     },
          { label: 'Activated On',    value: user.activationDate ?? 'Pending',    Icon: CheckCircle2 },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-4">
            <Icon size={16} className="text-teal-500 mb-2" />
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Scan status */}
      <div className={`rounded-2xl border p-4 flex items-center gap-4 ${scanColor[user.cardScanStatus] ?? 'bg-muted border-border text-foreground'}`}>
        {user.cardScanStatus === 'verified' ? <CheckCircle2 size={22} />
          : user.cardScanStatus === 'pending' ? <Clock size={22} />
          : <ScanLine size={22} />}
        <div>
          <p className="text-sm font-bold">Card Scan: {user.cardScanStatus.toUpperCase()}</p>
          <p className="text-xs mt-0.5 opacity-80">
            {user.cardScanStatus === 'verified' ? 'Card scanned and verified at S1 center. Wallet is active.'
              : user.cardScanStatus === 'scanned' ? 'Card scanned — awaiting final verification.'
              : 'Card not yet scanned at center. Visit your nearest center to activate.'}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <p className="text-sm font-semibold text-foreground mb-6">Enrollment Journey</p>
        <div className="space-y-0">
          {STEPS.map((step, i) => {
            const stepIdx  = ORDER.indexOf(step.key);
            const isDone   = stepIdx <= currentIdx;
            const isCurrent= stepIdx === currentIdx;
            return (
              <div key={step.key} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all
                    ${isDone
                      ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-200'
                      : isCurrent
                      ? 'bg-white border-teal-400 text-teal-500'
                      : 'bg-muted border-border text-muted-foreground'}`}>
                    {isDone && !isCurrent
                      ? <CheckCircle2 size={16} />
                      : <step.Icon size={16} />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-0.5 h-10 my-1 ${isDone ? 'bg-teal-400' : 'bg-border'}`} />
                  )}
                </div>
                {/* Content */}
                <div className={`pb-6 ${i === STEPS.length - 1 ? 'pb-0' : ''}`}>
                  <p className={`text-sm font-semibold ${isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                    {isCurrent && (
                      <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-600">Current</span>
                    )}
                  </p>
                  <p className={`text-xs mt-0.5 ${isDone ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
