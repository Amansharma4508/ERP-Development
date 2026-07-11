'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, HeartPulse, CalendarDays, Wallet, Stethoscope,
  Package, ShoppingCart, BookOpen, Menu, LogOut, Cross,
  Truck, Users, Warehouse, MapPin, ReceiptText,
} from 'lucide-react';

const NAV_ALL = [
  { name: 'Dashboard',      href: '/dashboard',                      Icon: LayoutDashboard, roles: ['user','doctor','admin','logistics'] },
  { name: 'Health Records', href: '/dashboard/health',                Icon: HeartPulse,      roles: ['user','admin'] },
  { name: 'Appointments',   href: '/dashboard/appointments',          Icon: CalendarDays,    roles: ['user','doctor','admin'] },
  { name: 'Wallet',         href: '/dashboard/wallet',                Icon: Wallet,          roles: ['user','admin'] },
  { name: 'Doctors',        href: '/dashboard/doctors',               Icon: Stethoscope,     roles: ['user','admin'] },
  { name: 'Inventory',      href: '/dashboard/inventory',             Icon: Package,         roles: ['doctor','admin'] },
  { name: 'Orders',         href: '/dashboard/orders',                Icon: ShoppingCart,    roles: ['doctor','admin'] },
  { name: 'Accounting',     href: '/dashboard/accounting',            Icon: BookOpen,        roles: ['admin'] },
  // ── Logistics Panel ──────────────────────────────────────────────────────
  { name: 'Shipments',      href: '/dashboard/logistics/shipments',   Icon: Truck,           roles: ['logistics','admin'] },
  { name: 'Vendors',        href: '/dashboard/logistics/vendors',     Icon: Users,           roles: ['logistics','admin'] },
  { name: 'Warehouses',     href: '/dashboard/logistics/warehouses',  Icon: Warehouse,       roles: ['logistics','admin'] },
  { name: 'Team',           href: '/dashboard/logistics/team',        Icon: MapPin,          roles: ['logistics','admin'] },
  { name: 'Funds Ledger',   href: '/dashboard/logistics/ledger',      Icon: ReceiptText,     roles: ['logistics','admin'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    // Redirect logistics users to their dedicated home
    if (!isLoading && user?.role === 'logistics') router.push('/dashboard/logistics');
  }, [user, isLoading, router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
            <Cross className="text-white" size={22} />
          </div>
          <div className="w-40 h-1.5 rounded-full overflow-hidden bg-indigo-100 mx-auto">
            <div className="h-full bg-indigo-500 animate-pulse rounded-full" style={{ width: '60%' }} />
          </div>
          <p className="text-sm text-muted-foreground mt-3">Loading…</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const navItems = NAV_ALL.filter((n) => n.roles.includes(user.role));

  const roleColors: Record<string, string> = {
    user:      'bg-blue-100 text-blue-700',
    doctor:    'bg-emerald-100 text-emerald-700',
    admin:     'bg-violet-100 text-violet-700',
    logistics: 'bg-amber-100 text-amber-700',
  };

  const initials = user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-sidebar-border ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#818cf8,#a78bfa)' }}>
          <Cross size={18} className="text-white" />
        </div>
        {!collapsed && <span className="font-bold text-lg text-white tracking-tight">HealthERP</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.filter(n => !['Shipments','Vendors','Warehouses','Team','Funds Ledger'].includes(n.name)).map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm group
                ${active
                  ? 'bg-sidebar-accent text-white shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.name : undefined}
            >
              <item.Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300" />
              )}
            </Link>
          );
        })}
        {navItems.some(n => ['Shipments','Vendors','Warehouses','Team','Funds Ledger'].includes(n.name)) && (
          <>
            {!collapsed && <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3 pt-4 pb-1">Logistics</p>}
            {navItems.filter(n => ['Shipments','Vendors','Warehouses','Team','Funds Ledger'].includes(n.name)).map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm
                    ${active ? 'bg-amber-600/80 text-white shadow-sm' : 'text-sidebar-foreground hover:bg-amber-600/50 hover:text-white'}
                    ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.name : undefined}
                >
                  <item.Icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                  {active && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-300" />}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className={`p-3 border-t border-sidebar-border ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-indigo-300 text-xs truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — desktop */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 bg-sidebar
        ${collapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent />
      </aside>

      {/* Sidebar — mobile */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar flex flex-col lg:hidden transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-card border-b border-border flex items-center px-4 lg:px-8 gap-4 flex-shrink-0 sticky top-0 z-20">
          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted transition text-muted-foreground">
            <Menu size={18} />
          </button>
          <button onClick={() => setMobileOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted transition text-muted-foreground">
            <Menu size={18} />
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">
              {navItems.find((n) => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.name ?? 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-semibold ${roleColors[user.role]}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground leading-tight">{user.fullName}</p>
            </div>
            <button onClick={() => { logout(); router.push('/login'); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition">
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
