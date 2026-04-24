'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#dbeedf,transparent_40%),linear-gradient(180deg,#f9fcf9_0%,#f5f7f4_100%)] p-6">
      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <section className="space-y-6">
          <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            UltraSpark Admin
          </span>
          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
              Keep every lead, request, and follow-up visible.
            </h1>
            <p className="max-w-2xl text-lg text-slate-600">
              Monitor quotes, bookings, contact messages, customer history, and service demand
              from one focused dashboard connected directly to the live NestJS API.
            </p>
          </div>
        </section>
        <div className="flex justify-center lg:justify-end">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
