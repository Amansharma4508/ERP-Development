'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MailCheck, AlertCircle } from 'lucide-react';

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
        throw new Error(result.error || 'Unable to send reset link.');
      }

      setMessage(result.message || 'If an account exists for this email, a reset link has been sent.');
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
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/login" className="inline-flex items-center gap-2 hover:text-foreground">
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>

        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Password recovery</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Forgot your password?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the email address linked to your account and we’ll send a secure reset link.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <div className="flex items-center gap-2 font-medium">
              <MailCheck size={16} />
              {message}
            </div>
          </div>
        )}

        {resetLink && (
          <div className="mb-4 rounded-2xl border border-dashed border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Fallback reset link</p>
            <a href={resetLink} className="mt-2 inline-block break-all text-primary hover:underline">
              {resetLink}
            </a>
          </div>
        )}

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
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
}
