'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarDays, Clock, HeartPulse, Wallet, ShoppingCart, AlertTriangle,
  Stethoscope, TrendingUp, TrendingDown, DollarSign, Target, CheckCircle,
  CalendarCheck, Package, BookOpen, ArrowRight, Activity, Database, ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Stats {
  totalAppointments?: number; upcomingAppointments?: number;
  healthRecords?: number; walletBalance?: number;
  pendingAppointments?: number; confirmedAppointments?: number; completedAppointments?: number;
  pendingOrders?: number; lowStockItems?: number; totalInventoryItems?: number;
  revenue?: number; expenses?: number; profit?: number; totalDoctors?: number;
  recentAppointments?: any[];
}

function StatCard({ label, value, Icon, gradient, sub }: {
  label: string; value: string | number; Icon: LucideIcon; gradient: string; sub?: string;
}) {
  return (
    <div className={`rounded-2xl p-6 text-white shadow-lg ${gradient} animate-fade-in-up`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/70 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
          {sub && <p className="text-white/60 text-xs mt-2">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'badge-pending', confirmed: 'badge-confirmed',
  completed: 'badge-completed', cancelled: 'badge-cancelled', rejected: 'badge-rejected',
};

export default function DashboardPage() {
  const { user, token, walletOnboardingStatus, setWalletOnboardingStatus } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-64 rounded-2xl" /><div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{greeting()}, {user?.fullName.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening today</p>
        </div>
        <div className="text-sm text-muted-foreground hidden sm:block">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats — User */}
      {user?.role === 'user' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Appointments" value={stats.totalAppointments ?? 0} Icon={CalendarDays} gradient="stat-indigo" sub="All time" />
          <StatCard label="Upcoming" value={stats.upcomingAppointments ?? 0} Icon={Clock} gradient="stat-violet" sub="Confirmed / Pending" />
          <StatCard label="Health Records" value={stats.healthRecords ?? 0} Icon={HeartPulse} gradient="stat-cyan" sub="Medical documents" />
          <StatCard label="Wallet Balance" value={`₹${(stats.walletBalance ?? 35000).toLocaleString()}`} Icon={Wallet} gradient="stat-emerald" sub="Available funds" />
        </div>
      )}

      {/* Stats — Doctor */}
      {user?.role === 'doctor' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Appointments" value={stats.totalAppointments ?? 0} Icon={CalendarDays} gradient="stat-indigo" sub="All time" />
          <StatCard label="Pending" value={stats.pendingAppointments ?? 0} Icon={Clock} gradient="stat-amber" sub="Awaiting confirmation" />
          <StatCard label="Confirmed" value={stats.confirmedAppointments ?? 0} Icon={CheckCircle} gradient="stat-emerald" sub="Upcoming" />
          <StatCard label="Completed" value={stats.completedAppointments ?? 0} Icon={Target} gradient="stat-cyan" sub="Done" />
        </div>
      )}

      {/* Stats — Admin */}
      {user?.role === 'admin' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Appointments" value={stats.totalAppointments ?? 0} Icon={CalendarDays} gradient="stat-indigo" sub="All time" />
            <StatCard label="Pending Orders" value={stats.pendingOrders ?? 0} Icon={ShoppingCart} gradient="stat-amber" sub="Awaiting processing" />
            <StatCard label="Low Stock Items" value={stats.lowStockItems ?? 0} Icon={AlertTriangle} gradient="stat-rose" sub="Need reorder" />
            <StatCard label="Total Doctors" value={stats.totalDoctors ?? 0} Icon={Stethoscope} gradient="stat-violet" sub="Active practitioners" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Revenue" value={`$${(stats.revenue ?? 0).toLocaleString()}`} Icon={TrendingUp} gradient="stat-emerald" sub="Total income" />
            <StatCard label="Expenses" value={`$${(stats.expenses ?? 0).toLocaleString()}`} Icon={TrendingDown} gradient="stat-rose" sub="Total outflow" />
            <StatCard label="Net Profit" value={`$${(stats.profit ?? 0).toLocaleString()}`} Icon={DollarSign} gradient="stat-cyan" sub="Revenue - Expenses" />
          </div>
        </>
      )}

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">Recent Appointments</h3>
            <Link href="/dashboard/appointments" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {stats.recentAppointments?.length ? (
            <div className="space-y-3">
              {stats.recentAppointments.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <CalendarDays size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {user?.role === 'doctor' ? a.patientName : a.doctorName}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.date} · {a.time}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[a.status] ?? ''}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No appointments yet</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-5">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {user?.role === 'user' && (<>
              <Link href="/dashboard/appointments" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-indigo-300 hover:bg-indigo-50 transition group">
                <CalendarCheck size={24} className="text-muted-foreground group-hover:text-indigo-600" />
                <span className="text-sm font-medium text-foreground group-hover:text-indigo-600 text-center">Book Appointment</span>
              </Link>
              <Link href="/dashboard/health" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-cyan-300 hover:bg-cyan-50 transition group">
                <HeartPulse size={24} className="text-muted-foreground group-hover:text-cyan-600" />
                <span className="text-sm font-medium text-foreground group-hover:text-cyan-600 text-center">Add Health Record</span>
              </Link>
              <Link href="/dashboard/wallet" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-emerald-300 hover:bg-emerald-50 transition group">
                <Wallet size={24} className="text-muted-foreground group-hover:text-emerald-600" />
                <span className="text-sm font-medium text-foreground group-hover:text-emerald-600 text-center">Top Up Wallet</span>
              </Link>
              <Link href="/dashboard/doctors" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-violet-300 hover:bg-violet-50 transition group">
                <Stethoscope size={24} className="text-muted-foreground group-hover:text-violet-600" />
                <span className="text-sm font-medium text-foreground group-hover:text-violet-600 text-center">Find Doctors</span>
              </Link>
            </>)}
            {user?.role === 'doctor' && (<>
              <Link href="/dashboard/appointments" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-indigo-300 hover:bg-indigo-50 transition group">
                <CalendarDays size={24} className="text-muted-foreground group-hover:text-indigo-600" />
                <span className="text-sm font-medium text-foreground group-hover:text-indigo-600 text-center">Manage Appointments</span>
              </Link>
              <Link href="/dashboard/inventory" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-amber-300 hover:bg-amber-50 transition group">
                <Package size={24} className="text-muted-foreground group-hover:text-amber-600" />
                <span className="text-sm font-medium text-foreground group-hover:text-amber-600 text-center">Check Inventory</span>
              </Link>
            </>)}
            {user?.role === 'admin' && (<>
              <Link href="/dashboard/appointments" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-indigo-300 hover:bg-indigo-50 transition group">
                <CalendarDays size={24} className="text-muted-foreground group-hover:text-indigo-600" />
                <span className="text-sm font-medium text-foreground group-hover:text-indigo-600 text-center">Appointments</span>
              </Link>
              <Link href="/dashboard/inventory" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-amber-300 hover:bg-amber-50 transition group">
                <Package size={24} className="text-muted-foreground group-hover:text-amber-600" />
                <span className="text-sm font-medium text-foreground group-hover:text-amber-600 text-center">Inventory</span>
              </Link>
              <Link href="/dashboard/orders" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-cyan-300 hover:bg-cyan-50 transition group">
                <ShoppingCart size={24} className="text-muted-foreground group-hover:text-cyan-600" />
                <span className="text-sm font-medium text-foreground group-hover:text-cyan-600 text-center">Orders</span>
              </Link>
              <Link href="/dashboard/accounting" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-emerald-300 hover:bg-emerald-50 transition group">
                <BookOpen size={24} className="text-muted-foreground group-hover:text-emerald-600" />
                <span className="text-sm font-medium text-foreground group-hover:text-emerald-600 text-center">Accounting</span>
              </Link>
            </>)}
          </div>
        </div>
      </div>

      {/* System status */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-sm font-medium text-foreground">System Status</span>
          {[
            { label: 'API', Icon: Activity },
            { label: 'Database', Icon: Database },
            { label: 'Auth Service', Icon: ShieldCheck },
          ].map(({ label, Icon }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Icon size={13} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{label} — Operational</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}