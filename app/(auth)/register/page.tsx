'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Stethoscope, Cross, AlertCircle, Truck, Wallet, Check } from 'lucide-react';

const ROLES = [
  { value: 'user',        label: 'Patient',        Icon: User,        desc: 'Book appointments, track health records',      color: 'border-indigo-400 bg-indigo-50 text-indigo-700'  },
  { value: 'doctor',      label: 'Doctor',         Icon: Stethoscope, desc: 'Manage appointments and patients',               color: 'border-emerald-400 bg-emerald-50 text-emerald-700'},
  { value: 'logistics',   label: 'Logistics',      Icon: Truck,       desc: 'Supply chain and shipment tracking',            color: 'border-amber-400 bg-amber-50 text-amber-700'     },
  { value: 'wallet_user', label: 'Virtual Wallet', Icon: Wallet,      desc: 'State-funded ₹35,000 health wallet account',  color: 'border-teal-400 bg-teal-50 text-teal-700'        },
];

const NEEDS_APPROVAL = ['doctor', 'logistics'];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  
  const [form, setForm]     = useState({ fullName: '', email: '', phone: '', password: '', role: 'user' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Phone number input handler to allow only numbers and restrict up to 10 digits
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Non-digit characters ko remove karega
    if (val.length <= 10) {
      setForm({ ...form, phone: val });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate 10 digits before submitting
    if (form.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    setError(''); setLoading(true);
    try {
      const { user } = await register(form.email, form.password, form.fullName, form.role, form.phone);

      if (NEEDS_APPROVAL.includes(user.role)) {
        router.push('/pending-approval');
      } else if (user.role === 'wallet_user') {
        router.push('/virtual-wallet');
      } else {
        router.push(user.role === 'user' ? '/onboarding/wallet' : '/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const selectedRole = ROLES.find(r => r.value === form.role);

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
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              Join<br /><span className="text-indigo-300">HealthERP</span>
            </h1>
            <p className="text-indigo-200 text-lg">Create your account and get started in seconds.</p>
          </div>
          <div className="grid gap-3">
            {ROLES.map((r) => (
              <div key={r.value}
                className={`flex items-center gap-4 p-3.5 rounded-xl transition-all
                  ${form.role === r.value ? 'bg-white/20 border border-white/30' : 'bg-white/10'}`}>
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <r.Icon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{r.label}</p>
                  <p className="text-indigo-200 text-xs truncate">{r.desc}</p>
                </div>
                {form.role === r.value && (
                  <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 text-2xl font-bold">
              <Cross size={22} className="text-indigo-600" />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">HealthERP</span>
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
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                  placeholder="John Carter" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                  placeholder="you@example.com" required />
              </div>

              {/* 10-Digit Numerical Phone Number Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number (10 digits)</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={form.phone} 
                  onChange={handlePhoneChange}
                  maxLength={10}
                  pattern="\d{10}"
                  title="Please enter exactly 10 digits numerical phone number"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                  placeholder="9876543210" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                  placeholder="Min 6 characters" required minLength={6} />
              </div>

              {/* Account type selector */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Account type</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button type="button" key={r.value} onClick={() => setForm({ ...form, role: r.value })}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-sm font-medium
                        ${form.role === r.value ? r.color + ' border-2' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                      <r.Icon size={18} />
                      <span>{r.label}</span>
                      {r.value === 'wallet_user' && (
                        <span className="text-[10px] font-semibold text-teal-600 leading-tight">₹35,000 allocated</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {NEEDS_APPROVAL.includes(form.role) && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                  Your account will need admin approval before you can access the dashboard.
                </div>
              )}

              {form.role === 'wallet_user' && (
                <div className="px-4 py-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 text-xs space-y-1">
                  <p className="font-semibold flex items-center gap-1.5"><Wallet size={13} /> Virtual Wallet Account</p>
                  <p>You will receive a physical card with ₹35,000 state-funded allocation. Spend offline at S1/S2/S3/DHS centers or online via teleconsult &amp; e-medicine.</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold text-white transition-all
                  ${form.role === 'wallet_user' ? 'bg-gradient-to-r from-teal-500 to-cyan-600' : ''}`}
                style={form.role !== 'wallet_user' ? { background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #7c3aed)' } : {}}>
                {loading ? 'Creating account…' : `Create ${selectedRole?.label ?? ''} Account`}
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