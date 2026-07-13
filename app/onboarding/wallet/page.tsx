'use client';

import { useRouter } from 'next/navigation';
import WalletOnboardingForm from '@/components/wallet-onboarding-form';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';

export default function WalletOnboardingPage() {
  const router = useRouter();
  const { user, walletOnboardingStatus, setWalletOnboardingStatus } = useAuth();

  useEffect(() => {
    if (user?.role !== 'user') {
      router.replace('/dashboard');
    }
  }, [router, user]);

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-600">Wallet onboarding</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Complete your wallet application before entering the dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Please fill in the required details below. Once you submit the form, the dashboard will open and wallet features will remain hidden until your application is approved.
          </p>
        </div>

        <WalletOnboardingForm
          onSubmitted={() => {
            setWalletOnboardingStatus('in-progress');
            router.replace('/dashboard');
          }}
        />
      </div>
    </div>
  );
}
