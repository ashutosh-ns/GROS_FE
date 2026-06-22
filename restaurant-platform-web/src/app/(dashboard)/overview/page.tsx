'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { restaurantsApi } from '@/lib/api/restaurants';
import { formatPrice, formatTime } from '@/lib/utils';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  activeTables: number;
  totalTables: number;
  pendingOrders: number;
}

interface RecentOrder {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  placedAt: string;
  table?: { number: number };
  items?: { quantity: number; menuItem: { name: string } }[];
}

const STATUS_COLORS: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-indigo-100 text-indigo-700',
  PREPARING: 'bg-yellow-100 text-yellow-700',
  READY: 'bg-green-100 text-green-700',
  SERVED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function DashboardOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    activeTables: 0,
    totalTables: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeRestaurantId) loadDashboard();
  }, [activeRestaurantId]);

  const loadDashboard = async () => {
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        restaurantsApi.getOrders(activeRestaurantId!, { limit: '50' }),
        restaurantsApi.getTables(activeRestaurantId!),
      ]);

      const allOrders: RecentOrder[] = (ordersRes as any).data?.data || [];
      const tables: any[] = (tablesRes as any).data || [];

      const today = new Date().toDateString();
      const todayOrders = allOrders.filter(
        (o) => new Date(o.placedAt).toDateString() === today,
      );
      const todayRevenue = todayOrders
        .filter((o) => o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + o.total, 0);
      const pendingOrders = allOrders.filter((o) =>
        ['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status),
      ).length;
      const activeTables = tables.filter((t) => t.isActive).length;

      setStats({
        todayOrders: todayOrders.length,
        todayRevenue,
        activeTables,
        totalTables: tables.length,
        pendingOrders,
      });

      setRecentOrders(allOrders.slice(0, 10));
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome back, {user?.firstName}! Here&apos;s your restaurant overview.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Orders" value={stats.todayOrders.toString()} />
        <StatCard title="Revenue Today" value={formatPrice(stats.todayRevenue)} />
        <StatCard title="Active Tables" value={`${stats.activeTables}/${stats.totalTables}`} />
        <StatCard title="Pending Orders" value={stats.pendingOrders.toString()} highlight={stats.pendingOrders > 0} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <div className="mt-4 rounded-md border p-8 text-center text-muted-foreground">
            No orders yet. Share QR codes with customers to get started.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold">#{order.orderNumber}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] || ''}`}>
                    {order.status}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Table {order.table?.number || '-'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{formatPrice(order.total)}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{formatTime(order.placedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border bg-card p-6 ${highlight ? 'border-orange-300 bg-orange-50' : ''}`}>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
