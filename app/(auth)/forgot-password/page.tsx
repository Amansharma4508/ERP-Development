'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setResetLink('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to process request.');
      }

      setMessage(result.message || 'Account verified.');
      if (result.resetLink) {
        setResetLink(result.resetLink);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/login" className="inline-flex items-center gap-2 hover:text-foreground">
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>

        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Password recovery</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Reset Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your registered email to generate a direct password reset link.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Agar reset link mil gaya, toh screen par bada sa Action Button dikhao */}
        {resetLink ? (
          <div className="my-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center space-y-3">
            <div className="inline-flex p-3 bg-primary/10 rounded-full text-primary">
              <KeyRound size={24} />
            </div>
            <p className="text-sm font-medium text-foreground">Ready to create a new password?</p>
            <a
              href={resetLink}
              className="block w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
            >
              Proceed to New Password Screen
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary"
                placeholder="you@example.com"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Verifying...' : 'Generate Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}