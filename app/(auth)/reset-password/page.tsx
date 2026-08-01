'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setError('This reset link is missing a security token. Please request a new password reset email.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        const result = await response.json();

        if (!response.ok || !result.valid) {
          setStatus('invalid');
          setError(result.error || 'This reset link is invalid or has expired.');
          return;
        }

        setStatus('valid');
        setEmail(result.email || 'your account');
      } catch {
        setStatus('invalid');
        setError('We could not verify this reset link. Please request a new one.');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError('Password must be at least 8 characters and contain both letters and numbers.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Password reset failed.');
      }

      setSuccess(result.message || 'Password reset successful.');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => router.push('/login'), 1800);
    } catch (err: any) {
      setError(err.message || 'Unable to update your password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Secure reset</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Create a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {status === 'valid' ? `You are updating the password for ${email}.` : 'Use the secure link from your email to continue.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 size={16} />
            {success}
          </div>
        )}

        {status === 'checking' && (
          <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Verifying your reset link…
          </div>
        )}

        {status === 'valid' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">New password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary"
                placeholder="Minimum 8 characters"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Confirm new password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary"
                placeholder="Re-enter your password"
                required
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        {status === 'invalid' && (
          <div className="space-y-4 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <KeyRound size={16} />
              <span className="font-medium">Reset link not valid</span>
            </div>
            <Link href="/forgot-password" className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background px-4 py-10 text-sm text-muted-foreground">Loading reset link…</div>}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
