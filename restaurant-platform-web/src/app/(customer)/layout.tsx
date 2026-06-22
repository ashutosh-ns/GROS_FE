'use client';

import { useSessionStore } from '@/lib/stores/session-store';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { restaurantName } = useSessionStore();

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background shadow-sm">
      {children}
    </div>
  );
}
