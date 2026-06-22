'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { formatPrice } from '@/lib/utils';

interface PlatformStats {
  totalRestaurants: number;
  activeRestaurants: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res: any = await adminApi.getStats();
      setStats(res.data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading platform stats...</div>;
  if (!stats) return <div className="p-6">Failed to load stats</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Platform Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        RestaurantOS platform-wide metrics
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Restaurants" value={stats.totalRestaurants.toString()} sub={`${stats.activeRestaurants} active`} />
        <StatCard title="Total Users" value={stats.totalUsers.toString()} />
        <StatCard title="Total Orders" value={stats.totalOrders.toString()} sub={`${stats.ordersThisMonth} this month`} />
        <StatCard title="Total Revenue" value={formatPrice(stats.totalRevenue)} sub={`${formatPrice(stats.revenueThisMonth)} this month`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="mt-4 space-y-2">
            <a href="/admin/restaurants" className="block rounded-md border px-4 py-3 text-sm hover:bg-accent">
              🏪 Manage Restaurants
            </a>
            <a href="/admin/users" className="block rounded-md border px-4 py-3 text-sm hover:bg-accent">
              👥 Manage Users
            </a>
            <a href="/admin/audit-logs" className="block rounded-md border px-4 py-3 text-sm hover:bg-accent">
              📜 View Audit Logs
            </a>
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Platform Health</h2>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Active Restaurants</span>
              <span className="font-medium">
                {stats.totalRestaurants > 0
                  ? Math.round((stats.activeRestaurants / stats.totalRestaurants) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Avg Revenue/Restaurant</span>
              <span className="font-medium">
                {formatPrice(stats.activeRestaurants > 0 ? stats.totalRevenue / stats.activeRestaurants : 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Avg Orders/Restaurant</span>
              <span className="font-medium">
                {stats.activeRestaurants > 0 ? Math.round(stats.totalOrders / stats.activeRestaurants) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
