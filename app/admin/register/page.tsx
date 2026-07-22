'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ActivateAdminForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [verifying, setVerifying] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid link. Token is missing.');
      setVerifying(false);
      return;
    }

    async function verifyToken() {
      try {
        const res = await fetch(`/api/admin/invite?token=${token}`);
        const data = await res.json();

        if (!res.ok || !data.valid) {
          throw new Error(data.error || 'Invalid or expired invite link.');
        }

        setEmail(data.email);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setVerifying(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, fullName, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete setup.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 font-medium text-center">
          <p className="animate-pulse">Checking your invite link...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-md w-full text-center">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Setup Done!</h2>
          <p className="text-sm text-gray-600 mb-4">
            Your admin password has been set. Redirecting you to the login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Set Admin Password</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Set up your credentials to access the Admin Portal
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100 text-center">
            {error}
          </div>
        )}

        {!error && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-gray-100 border border-gray-200 p-2.5 rounded-xl text-gray-600 text-sm font-medium outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full border p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black"
                placeholder="Dr. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Set Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full border p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Confirm Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full border p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-black hover:bg-gray-800 text-white p-3 rounded-xl font-medium text-sm transition disabled:opacity-50 mt-2"
            >
              {submitting ? 'Setting up account...' : 'Set Password & Activate'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AdminRegisterPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <ActivateAdminForm />
    </Suspense>
  );
}