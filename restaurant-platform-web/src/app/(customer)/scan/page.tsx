'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/stores/session-store';
import { useCartStore } from '@/lib/stores/cart-store';

export default function ScanPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const clearCart = useCartStore((s) => s.clearCart);
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid QR code. No token provided.');
      return;
    }

    validateQR(token);
  }, [searchParams]);

  const validateQR = async (token: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${API_URL}/sessions/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Invalid QR code');
      }

      const result = await response.json();
      const data = result.data;

      // Clear previous cart on new session
      clearCart();

      // Store session
      setSession({
        sessionToken: data.sessionToken,
        restaurant: data.restaurant,
        table: data.table,
        expiresIn: data.expiresIn,
      });

      router.push('/menu');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to validate QR code');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Setting up your table...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <div className="text-4xl">😕</div>
        <h1 className="mt-4 text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Please ask the restaurant staff for help.
        </p>
      </div>
    </div>
  );
}
