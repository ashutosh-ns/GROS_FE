'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';

const adminNavItems = [
  { label: 'Overview', href: '/admin', icon: '📊' },
  { label: 'Restaurants', href: '/admin/restaurants', icon: '🏪' },
  { label: 'Users', href: '/admin/users', icon: '👥' },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: '📜' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.platformRole !== 'SUPER_ADMIN' && user?.platformRole !== 'PLATFORM_ADMIN') {
      router.push('/dashboard/overview');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user?.platformRole !== 'SUPER_ADMIN' && user?.platformRole !== 'PLATFORM_ADMIN')) {
    return null;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r bg-card">
        <div className="flex h-full flex-col">
          <div className="border-b px-4 py-4">
            <h2 className="text-lg font-bold">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Platform Management</p>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="border-t p-3 space-y-2">
            <Link
              href="/dashboard/overview"
              className="block w-full rounded-md border px-3 py-2 text-center text-sm hover:bg-accent"
            >
              Restaurant Dashboard
            </Link>
            <button
              onClick={() => { logout(); router.push('/login'); }}
              className="w-full rounded-md border px-3 py-2 text-sm hover:bg-accent"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
