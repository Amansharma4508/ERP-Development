'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wallet, UserCheck, CreditCard, Building2, BookOpen,
  WifiOff, FileText, BarChart3, LogOut, Menu, X,
  ChevronRight, Users,
} from 'lucide-react';

const NAV = [
  { name: 'Overview',        href: '/virtual-wallet',                  Icon: BarChart3,  desc: 'Dashboard summary'             },
  { name: 'Enrollment',      href: '/virtual-wallet/enrollment',       Icon: UserCheck,  desc: 'Card & activation status'      },
  { name: 'Fund Allocation', href: '/virtual-wallet/allocation',       Icon: CreditCard, desc: '₹35,000 state fund split'      },
  { name: 'Center Wallet',   href: '/virtual-wallet/center-wallet',    Icon: Building2,  desc: 'S1/S2/S3/DHS expenses'         },
  { name: 'State Wallet',    href: '/virtual-wallet/state-wallet',     Icon: Wallet,     desc: 'Master ledger & capital'       },
  { name: 'Transactions',    href: '/virtual-wallet/transactions',     Icon: WifiOff,    desc: 'Offline & online history'      },
  { name: 'Ledger',          href: '/virtual-wallet/ledger',           Icon: BookOpen,   desc: 'Credit notes & main ledger'    },
  { name: 'Family Members',  href: '/virtual-wallet/family',           Icon: Users,      desc: 'Linked family cards'           },
  { name: 'Final Summary',   href: '/virtual-wallet/summary',          Icon: FileText,   desc: 'Complete transaction audit'    },
];

export default function VirtualWalletLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) { router.push('/login'); return; }
    if (!isLoading && user && user.role !== 'wallet_user' && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
            <Wallet className="text-white" size={26} />
          </div>
          <p className="text-sm text-teal-600 font-medium">Loading Virtual Wallet…</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const initials = user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-teal-700/40 shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
          <Wallet size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white text-sm leading-tight truncate">Virtual Wallet</p>
          <p className="text-teal-300 text-xs">₹35,000 Health Fund</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href ||
            (item.href !== '/virtual-wallet' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                ${active
                  ? 'bg-teal-500/30 text-white border border-teal-400/30'
                  : 'text-teal-100/80 hover:bg-teal-500/20 hover:text-white'}`}>
              <item.Icon size={17} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight truncate">{item.name}</p>
                <p className={`text-xs truncate ${active ? 'text-teal-200' : 'text-teal-400/70 group-hover:text-teal-300'}`}>
                  {item.desc}
                </p>
              </div>
              {active && <ChevronRight size={13} className="text-teal-300 shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-teal-700/40 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user.fullName}</p>
            <p className="text-teal-300 text-xs truncate">{user.email}</p>
          </div>
        </div>
        <button onClick={() => { logout(); router.push('/login'); }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-teal-200 hover:bg-teal-500/20 hover:text-white transition">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );

  const currentNav = NAV.find(n =>
    pathname === n.href || (n.href !== '/virtual-wallet' && pathname.startsWith(n.href))
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0"
        style={{ background: 'linear-gradient(180deg, #0f766e 0%, #0e7490 100%)' }}>
        <SidebarContent />
      </aside>

      {/* Sidebar mobile */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col lg:hidden transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(180deg, #0f766e 0%, #0e7490 100%)' }}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-card border-b border-border flex items-center px-4 lg:px-6 gap-4 shrink-0 sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition">
            <Menu size={18} />
          </button>
          {mobileOpen && (
            <button onClick={() => setMobileOpen(false)}
              className="lg:hidden w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition">
              <X size={18} />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
                {currentNav ? <currentNav.Icon size={13} className="text-white" /> : <Wallet size={13} className="text-white" />}
              </div>
              <h2 className="text-sm font-semibold text-foreground truncate">
                {currentNav?.name ?? 'Virtual Wallet'}
              </h2>
            </div>
            {currentNav?.desc && (
              <p className="text-xs text-muted-foreground ml-8 truncate">{currentNav.desc}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
              Virtual Wallet
            </span>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-foreground leading-tight">{user.fullName}</p>
            </div>
            <button onClick={() => { logout(); router.push('/login'); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition">
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
