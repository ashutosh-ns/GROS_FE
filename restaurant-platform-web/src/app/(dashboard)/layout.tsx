'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';

const navItems = [
  { label: 'Overview', href: '/dashboard/overview', icon: '📊' },
  { label: 'Menu', href: '/dashboard/menu', icon: '🍽️' },
  { label: 'Orders', href: '/dashboard/orders', icon: '📋' },
  { label: 'Kitchen', href: '/dashboard/kitchen', icon: '👨‍🍳' },
  { label: 'Tables', href: '/dashboard/tables', icon: '🪑' },
  { label: 'QR Codes', href: '/dashboard/qr', icon: '📱' },
  { label: 'Offers', href: '/dashboard/offers', icon: '🎉' },
  { label: 'Members', href: '/dashboard/members', icon: '👥' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: '📈' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r bg-card md:block">
        <div className="flex h-full flex-col">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-bold">RestaurantOS</h2>
            <p className="text-xs text-muted-foreground">
              {user?.firstName} {user?.lastName}
            </p>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="border-t p-4">
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
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
