'use client';

import { useAuth } from '@/lib/auth-context';
import { useCallback, useEffect, useState } from 'react';
import { Users, UserCheck, Calendar, Droplets, Phone, ShieldCheck, UserX } from 'lucide-react';

const RELATION_COLOR: Record<string, string> = {
  self:    'bg-teal-100 text-teal-700',
  spouse:  'bg-violet-100 text-violet-700',
  child:   'bg-blue-100 text-blue-700',
  parent:  'bg-amber-100 text-amber-700',
  sibling: 'bg-pink-100 text-pink-700',
  other:   'bg-muted text-muted-foreground',
};

function calcAge(dob: string) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 864e5));
}

export default function FamilyMembersPage() {
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

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_,i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>;
  if (!data) return null;

  const members: any[] = data.familyMembers ?? [];
  const activeMembers  = members.filter((m: any) => m.isActive);
  const inactiveMembers= members.filter((m: any) => !m.isActive);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users size={22} className="text-pink-500" /> Family Members
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          All family members linked to card <strong>{data.user.cardNumber}</strong>.
          Each member shares the primary wallet allocation.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Linked',    value: members.length,        color: 'text-foreground',    bg: 'bg-muted border-border'               },
          { label: 'Active Members',  value: activeMembers.length,  color: 'text-emerald-600',   bg: 'bg-emerald-50 border-emerald-200'     },
          { label: 'Inactive',        value: inactiveMembers.length,color: 'text-muted-foreground',bg: 'bg-muted border-border'             },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-4 text-center ${bg}`}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Active members */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Active Members ({activeMembers.length})</p>
        {activeMembers.map((m: any) => (
          <div key={m.id} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shrink-0
                  ${m.gender === 'female' ? 'bg-linear-to-br from-pink-400 to-rose-500' : 'bg-linear-to-br from-teal-400 to-cyan-500'}`}>
                  {m.fullName.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-bold text-foreground">{m.fullName}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RELATION_COLOR[m.relationship] ?? RELATION_COLOR.other}`}>
                      {m.relationship}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                      <ShieldCheck size={10} /> Active
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{m.uid}</p>
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Age / DOB</p>
                  <p className="text-xs font-semibold text-foreground">{calcAge(m.dob)} yrs · {m.dob}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck size={14} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="text-xs font-semibold text-foreground capitalize">{m.gender}</p>
                </div>
              </div>
              {m.bloodGroup && (
                <div className="flex items-center gap-2">
                  <Droplets size={14} className="text-red-400 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Blood Group</p>
                    <p className="text-xs font-semibold text-foreground">{m.bloodGroup}</p>
                  </div>
                </div>
              )}
              {m.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-xs font-semibold text-foreground">{m.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Inactive members */}
      {inactiveMembers.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground">Inactive Members ({inactiveMembers.length})</p>
          {inactiveMembers.map((m: any) => (
            <div key={m.id} className="bg-card rounded-2xl border border-border p-4 opacity-60">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <UserX size={18} className="text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{m.fullName}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RELATION_COLOR[m.relationship] ?? RELATION_COLOR.other}`}>{m.relationship}</span>
                    <span className="text-xs bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full">Inactive</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{m.uid}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info note */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-xs text-teal-700">
        <p className="font-semibold mb-1">About Family Wallet Coverage</p>
        <p>All family members share the primary card holder&apos;s ₹35,000 allocation. Transactions made for a specific member will show their UID in the transaction details on the Transactions page.</p>
      </div>
    </div>
  );
}
