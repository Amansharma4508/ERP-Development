'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Clock, Cross, LogOut, Mail } from 'lucide-react';

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <div className="lg:hidden text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold">
            <Cross size={22} className="text-indigo-600" />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">HealthERP</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-xl border border-border p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5">
            <Clock size={30} className="text-amber-500" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Approval Pending</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Your {user?.role} account has been created successfully. An admin needs to
            review and approve your account before you can access the dashboard.
          </p>

          <div className="px-4 py-3 rounded-xl bg-muted border border-border text-sm text-muted-foreground flex items-center gap-2 justify-center mb-6">
            <Mail size={15} />
            <span>We&apos;ll notify you at <strong className="text-foreground">{user?.email}</strong> once approved</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl font-semibold text-foreground border border-border hover:bg-muted transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}