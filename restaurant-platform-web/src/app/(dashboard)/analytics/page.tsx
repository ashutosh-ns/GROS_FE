'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { restaurantsApi } from '@/lib/api/restaurants';
import { formatPrice } from '@/lib/utils';

type DateRange = 'today' | 'week' | 'month' | 'custom';

interface RevenueData {
  labels: string[];
  datasets: { date: string; revenue: number; orders: number }[];
  summary: { totalRevenue: number; totalOrders: number; avgOrderValue: number; totalTax: number };
}

interface OrderData {
  byStatus: Record<string, number>;
  peakHours: { hour: number; count: number }[];
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

interface ProductData {
  bestSellers: { name: string; quantity: number; revenue: number }[];
  worstPerformers: { name: string; quantity: number; revenue: number }[];
  totalItemsSold: number;
}

interface TableData {
  tables: { tableNumber: number; name: string | null; orders: number; revenue: number }[];
}

export default function AnalyticsPage() {
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);
  const [range, setRange] = useState<DateRange>('week');
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [orderStats, setOrderStats] = useState<OrderData | null>(null);
  const [products, setProducts] = useState<ProductData | null>(null);
  const [tables, setTables] = useState<TableData | null>(null);

  useEffect(() => {
    if (activeRestaurantId) loadAnalytics();
  }, [activeRestaurantId, range]);

  const getDateParams = (): Record<string, string> => {
    const to = new Date().toISOString();
    let from: Date;

    switch (range) {
      case 'today':
        from = new Date();
        from.setHours(0, 0, 0, 0);
        break;
      case 'week':
        from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    return { from: from.toISOString(), to };
  };

  const loadAnalytics = async () => {
    setLoading(true);
    const params = getDateParams();

    try {
      const [revenueRes, ordersRes, productsRes, tablesRes] = await Promise.all([
        restaurantsApi.getRevenueAnalytics(activeRestaurantId!, params),
        restaurantsApi.getOrderAnalytics(activeRestaurantId!, params),
        restaurantsApi.getProductAnalytics(activeRestaurantId!, params),
        restaurantsApi.getTableAnalytics(activeRestaurantId!, params),
      ]);

      setRevenue((revenueRes as any).data);
      setOrderStats((ordersRes as any).data);
      setProducts((productsRes as any).data);
      setTables((tablesRes as any).data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading analytics...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-1">
          {(['today', 'week', 'month'] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1 text-sm ${
                range === r ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              {r === 'today' ? 'Today' : r === 'week' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Summary Cards */}
      {revenue && (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <StatCard title="Revenue" value={formatPrice(revenue.summary.totalRevenue)} />
          <StatCard title="Orders" value={revenue.summary.totalOrders.toString()} />
          <StatCard title="Avg Order" value={formatPrice(revenue.summary.avgOrderValue)} />
          <StatCard title="Tax Collected" value={formatPrice(revenue.summary.totalTax)} />
        </div>
      )}

      {/* Revenue Chart (simple bar representation) */}
      {revenue && revenue.datasets.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Daily Revenue</h2>
          <div className="mt-4 rounded-lg border p-4">
            <div className="flex items-end gap-1" style={{ height: '200px' }}>
              {revenue.datasets.map((d) => {
                const maxRevenue = Math.max(...revenue.datasets.map((x) => x.revenue));
                const height = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{formatPrice(d.revenue)}</span>
                    <div
                      className="w-full rounded-t bg-primary"
                      style={{ height: `${height}%`, minHeight: d.revenue > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Order Stats + Peak Hours */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {orderStats && (
          <div>
            <h2 className="text-lg font-semibold">Order Statistics</h2>
            <div className="mt-4 rounded-lg border p-4">
              <div className="space-y-2">
                {Object.entries(orderStats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span>{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span>Completion Rate</span>
                  <span className="font-medium">
                    {orderStats.totalOrders > 0
                      ? Math.round((orderStats.completedOrders / orderStats.totalOrders) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cancellation Rate</span>
                  <span className="font-medium text-red-600">
                    {orderStats.totalOrders > 0
                      ? Math.round((orderStats.cancelledOrders / orderStats.totalOrders) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {orderStats && orderStats.peakHours.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold">Peak Hours</h2>
            <div className="mt-4 rounded-lg border p-4">
              <div className="space-y-2">
                {orderStats.peakHours.slice(0, 8).map((ph) => {
                  const maxCount = orderStats.peakHours[0]?.count || 1;
                  const width = (ph.count / maxCount) * 100;
                  return (
                    <div key={ph.hour} className="flex items-center gap-2 text-sm">
                      <span className="w-12 text-muted-foreground">
                        {ph.hour.toString().padStart(2, '0')}:00
                      </span>
                      <div className="flex-1">
                        <div
                          className="h-4 rounded bg-primary/20"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-medium">{ph.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Best Sellers */}
      {products && products.bestSellers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Best Sellers</h2>
          <div className="mt-4 rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-right">Qty Sold</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {products.bestSellers.map((item, i) => (
                  <tr key={item.name} className="border-b last:border-0">
                    <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2 text-right">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">{formatPrice(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table Performance */}
      {tables && tables.tables.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Table Performance</h2>
          <div className="mt-4 rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left">Table</th>
                  <th className="px-4 py-2 text-right">Orders</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                  <th className="px-4 py-2 text-right">Avg/Order</th>
                </tr>
              </thead>
              <tbody>
                {tables.tables.map((t) => (
                  <tr key={t.tableNumber} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">
                      Table {t.tableNumber} {t.name && `(${t.name})`}
                    </td>
                    <td className="px-4 py-2 text-right">{t.orders}</td>
                    <td className="px-4 py-2 text-right">{formatPrice(t.revenue)}</td>
                    <td className="px-4 py-2 text-right">
                      {formatPrice(t.orders > 0 ? t.revenue / t.orders : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!revenue?.summary.totalOrders && (
        <div className="mt-8 rounded-md border p-8 text-center text-muted-foreground">
          No order data for the selected period. Analytics will populate as orders come in.
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
