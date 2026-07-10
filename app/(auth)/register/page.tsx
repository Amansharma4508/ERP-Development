'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Stethoscope, ShieldCheck, Cross, AlertCircle } from 'lucide-react';

const ROLES = [
  { value: 'user', label: 'Patient', Icon: User, desc: 'Book appointments, track health records' },
  { value: 'doctor', label: 'Doctor', Icon: Stethoscope, desc: 'Manage appointments and patients' },
  { value: 'admin', label: 'Admin', Icon: ShieldCheck, desc: 'Full system access and management' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.email, form.password, form.fullName, form.role);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)' }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 20% 80%, #06b6d4 0%, transparent 50%)' }} />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
              <Cross size={32} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 leading-tight">Join<br /><span className="text-indigo-300">HealthERP</span></h1>
            <p className="text-indigo-200 text-lg">Create your account and get started in seconds.</p>
          </div>
          <div className="grid gap-4">
            {ROLES.map((r) => (
              <div key={r.value} className="flex items-center gap-4 p-4 rounded-xl bg-white/10">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <r.Icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">{r.label}</p>
                  <p className="text-indigo-200 text-sm">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 text-2xl font-bold gradient-text">
              <Cross size={22} className="text-indigo-600" /> HealthERP
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
            <h2 className="text-2xl font-bold text-foreground mb-1">Create account</h2>
            <p className="text-muted-foreground text-sm mb-6">Fill in your details to get started</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full name</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                  placeholder="John Carter" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                  placeholder="you@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                  placeholder="Min 6 characters" required minLength={6} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Account type</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button type="button" key={r.value} onClick={() => setForm({ ...form, role: r.value })}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-sm font-medium ${
                        form.role === r.value
                          ? 'border-primary bg-secondary text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}>
                      <r.Icon size={20} />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all"
                style={{ background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
