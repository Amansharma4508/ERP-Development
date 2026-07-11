'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Truck, Users, Warehouse, ReceiptText, TrendingUp, TrendingDown,
  Package, ArrowRight, CheckCircle, Clock, AlertTriangle, MapPin,
} from 'lucide-react';

interface Stats {
  totalShipments: number; inTransit: number; delivered: number; pending: number;
  activeVendors: number; totalVendors: number;
  activeTeam: number; totalTeam: number;
  totalDebits: number; totalCredits: number; netBalance: number; totalDue: number;
  warehouseUtil: { name: string; pointId: string; usedPct: number }[];
  recentShipments: any[];
}

const STATUS_STYLE: Record<string, string> = {
  po_received: 'badge-pending',
  prep:        'badge-pending',
  in_transit:  'badge-shipped',
  delivered:   'badge-delivered',
  cancelled:   'badge-cancelled',
};

const STATUS_LABEL: Record<string, string> = {
  po_received: 'PO Received',
  prep:        'Prep',
  in_transit:  'In Transit',
  delivered:   'Delivered',
  cancelled:   'Cancelled',
};

export default function LogisticsDashboard() {
  const { token } = useAuth();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    const res  = await fetch('/api/logistics/stats', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setStats(data.data);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-64 rounded-2xl" /><div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{greeting()} 🚚</h1>
          <p className="text-muted-foreground mt-1">Logistics & Supply Chain — Control Panel</p>
        </div>
        <div className="text-sm text-muted-foreground hidden sm:block">
          {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Shipments', value: stats?.totalShipments ?? 0,  Icon: Truck,       gradient:'stat-indigo' },
          { label:'In Transit',      value: stats?.inTransit ?? 0,        Icon: Clock,       gradient:'stat-amber'  },
          { label:'Delivered',       value: stats?.delivered ?? 0,        Icon: CheckCircle, gradient:'stat-emerald'},
          { label:'Active Vendors',  value: stats?.activeVendors ?? 0,    Icon: Users,       gradient:'stat-violet' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-6 text-white shadow-lg ${s.gradient} animate-fade-in-up`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-sm font-medium mb-1">{s.label}</p>
                <p className="text-3xl font-bold">{s.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <s.Icon size={20} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Finance row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-6 text-white shadow-lg stat-emerald">
          <div className="flex items-center gap-2 text-white/70 text-sm mb-2"><TrendingUp size={16}/> Total Credits</div>
          <p className="text-3xl font-bold">₹{(stats?.totalCredits ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl p-6 text-white shadow-lg stat-rose">
          <div className="flex items-center gap-2 text-white/70 text-sm mb-2"><TrendingDown size={16}/> Total Debits</div>
          <p className="text-3xl font-bold">₹{(stats?.totalDebits ?? 0).toLocaleString()}</p>
        </div>
        <div className={`rounded-2xl p-6 text-white shadow-lg ${(stats?.netBalance ?? 0) >= 0 ? 'stat-cyan' : 'stat-rose'}`}>
          <div className="flex items-center gap-2 text-white/70 text-sm mb-2"><ReceiptText size={16}/> Net Balance</div>
          <p className="text-3xl font-bold">₹{(stats?.netBalance ?? 0).toLocaleString()}</p>
          <p className="text-white/60 text-xs mt-1">Vendor Due: ₹{(stats?.totalDue ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Shipments */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">Recent Shipments</h3>
            <Link href="/dashboard/logistics/shipments"
              className="text-xs font-medium text-amber-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12}/>
            </Link>
          </div>
          {stats?.recentShipments?.length ? (
            <div className="space-y-3">
              {stats.recentShipments.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Truck size={16} className="text-amber-600"/>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">{s.shipmentId}</p>
                      <p className="text-xs text-muted-foreground">{s.vendorName} → {s.toLocation}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Truck size={36} className="mx-auto mb-2 opacity-20"/>
              <p className="text-sm">No shipments yet</p>
            </div>
          )}
        </div>

        {/* Warehouse Utilization */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">Warehouse Utilization</h3>
            <Link href="/dashboard/logistics/warehouses"
              className="text-xs font-medium text-amber-600 hover:underline flex items-center gap-1">
              Manage <ArrowRight size={12}/>
            </Link>
          </div>
          <div className="space-y-4">
            {stats?.warehouseUtil?.map(w => (
              <div key={w.pointId}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Warehouse size={14} className="text-amber-600"/>
                    <span className="text-sm font-medium text-foreground">{w.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{w.pointId}</span>
                  </div>
                  <span className={`text-sm font-bold ${w.usedPct > 85 ? 'text-red-600' : w.usedPct > 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {w.usedPct}%
                  </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${w.usedPct > 85 ? 'bg-red-500' : w.usedPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${w.usedPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Team summary */}
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-amber-600"/>
                <span className="text-sm font-medium text-foreground">Field Team</span>
              </div>
              <Link href="/dashboard/logistics/team"
                className="text-xs text-amber-600 hover:underline flex items-center gap-1">
                View team <ArrowRight size={11}/>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { label:'Total',    value: stats?.totalTeam ?? 0,  color:'bg-muted text-foreground' },
                { label:'Active',   value: stats?.activeTeam ?? 0, color:'bg-emerald-50 text-emerald-700' },
                { label:'On Leave', value: (stats?.totalTeam ?? 0) - (stats?.activeTeam ?? 0), color:'bg-amber-50 text-amber-700' },
              ].map(t => (
                <div key={t.label} className={`rounded-xl p-3 text-center ${t.color}`}>
                  <p className="text-xl font-bold">{t.value}</p>
                  <p className="text-xs mt-0.5">{t.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:'New Shipment', href:'/dashboard/logistics/shipments', Icon: Truck,       color:'hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700' },
            { label:'Add Vendor',   href:'/dashboard/logistics/vendors',   Icon: Users,       color:'hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700' },
            { label:'Manage Stock', href:'/dashboard/logistics/warehouses',Icon: Package,     color:'hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-700' },
            { label:'Funds Ledger', href:'/dashboard/logistics/ledger',    Icon: ReceiptText, color:'hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700' },
          ].map(a => (
            <Link key={a.label} href={a.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-border transition group ${a.color}`}>
              <a.Icon size={24} className="text-muted-foreground group-hover:text-current"/>
              <span className="text-sm font-medium text-foreground group-hover:text-current text-center">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* System status */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-sm font-medium text-foreground">Logistics System Status</span>
          {['Shipment Tracker','Vendor Portal','Warehouse API','Ledger Service'].map(s => (
            <div key={s} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
              <span className="text-xs text-muted-foreground">{s} — Operational</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
