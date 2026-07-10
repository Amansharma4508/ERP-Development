'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Stethoscope, ShieldCheck, Cross, AlertCircle, Check } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { email: 'user@example.com', password: 'password123', role: 'User', Icon: User },
  { email: 'doctor@example.com', password: 'password123', role: 'Doctor', Icon: Stethoscope },
  { email: 'admin@example.com', password: 'password123', role: 'Admin', Icon: ShieldCheck },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setError('');
    setLoading(true);
    try {
      await login(acc.email, acc.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4f46e5 100%)' }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 80% 20%, #06b6d4 0%, transparent 50%)' }} />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
              <Cross size={32} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              HealthERP<br />
              <span className="text-indigo-300">Management</span>
            </h1>
            <p className="text-indigo-200 text-lg leading-relaxed">
              A complete enterprise solution for healthcare management — appointments, records, inventory, and finance in one place.
            </p>
          </div>
          <div className="space-y-4">
            {['Real-time appointment management', 'Secure health records', 'Inventory & supply chain', 'Financial accounting'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-indigo-100">
                <div className="w-5 h-5 rounded-full bg-indigo-400/40 flex items-center justify-center">
                  <Check size={11} className="text-white" />
                </div>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full border border-white/10" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 text-2xl font-bold gradient-text">
              <Cross size={22} className="text-indigo-600" /> HealthERP
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
            <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
            <p className="text-muted-foreground text-sm mb-6">Sign in to your account to continue</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all"
                style={{ background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs text-muted-foreground bg-card px-2">or try a demo account</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => handleDemo(acc)}
                  disabled={loading}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-border hover:border-ring hover:bg-secondary transition-all text-center"
                >
                  <acc.Icon size={20} className="text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{acc.role}</span>
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
