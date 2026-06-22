'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { restaurantsApi } from '@/lib/api/restaurants';
import type { Order, OrderStatus } from '@/types';

const KDS_COLUMNS: { status: OrderStatus; label: string; color: string }[] = [
  { status: 'PLACED', label: 'New', color: 'border-blue-500' },
  { status: 'ACCEPTED', label: 'Accepted', color: 'border-indigo-500' },
  { status: 'PREPARING', label: 'Preparing', color: 'border-yellow-500' },
  { status: 'READY', label: 'Ready', color: 'border-green-500' },
];

export default function KitchenDisplayPage() {
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (activeRestaurantId) {
      loadOrders();
      const interval = setInterval(loadOrders, 3000);
      return () => clearInterval(interval);
    }
  }, [activeRestaurantId]);

  const loadOrders = async () => {
    try {
      // Fetch active orders only
      const res: any = await restaurantsApi.getOrders(activeRestaurantId!, { limit: '100' });
      const allOrders = res.data?.data || [];
      const activeOrders = allOrders.filter((o: Order) =>
        ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status),
      );

      // Play sound on new order
      if (activeOrders.length > prevCountRef.current && prevCountRef.current > 0) {
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {});
        } catch {}
      }
      prevCountRef.current = activeOrders.length;

      setOrders(activeOrders);
    } catch {
      // silent retry
    } finally {
      setLoading(false);
    }
  };

  const handleAdvance = async (orderId: string, currentStatus: OrderStatus) => {
    const next: Record<string, string> = {
      PLACED: 'ACCEPTED',
      ACCEPTED: 'PREPARING',
      PREPARING: 'READY',
      READY: 'SERVED',
    };
    const nextStatus = next[currentStatus];
    if (!nextStatus) return;

    try {
      await restaurantsApi.updateOrderStatus(activeRestaurantId!, orderId, nextStatus);
      loadOrders();
    } catch {
      alert('Failed to update order');
    }
  };

  const getTimeSince = (dateStr: string): string => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const getTimeColor = (dateStr: string): string => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 10) return 'text-green-600';
    if (diff < 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kitchen Display</h1>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-sm text-muted-foreground">Live (3s refresh)</span>
        </div>
      </div>

      {/* KDS Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {KDS_COLUMNS.map((column) => {
          const columnOrders = orders.filter((o) => o.status === column.status);
          return (
            <div key={column.status} className="flex flex-col">
              <div className={`rounded-t-lg border-t-4 ${column.color} bg-muted px-3 py-2`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{column.label}</span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs font-bold">
                    {columnOrders.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2 rounded-b-lg border border-t-0 bg-background p-2">
                {columnOrders.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">No orders</p>
                ) : (
                  columnOrders.map((order) => (
                    <div key={order.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">#{order.orderNumber}</span>
                        <span className={`text-xs font-medium ${getTimeColor(order.placedAt)}`}>
                          {getTimeSince(order.placedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Table {(order as any).table?.number || '-'}
                      </p>
                      <div className="mt-2 space-y-1">
                        {order.items?.map((item) => (
                          <p key={item.id} className="text-sm">
                            <span className="font-medium">{item.quantity}x</span> {item.menuItem.name}
                            {item.notes && <span className="text-xs italic text-muted-foreground"> ({item.notes})</span>}
                          </p>
                        ))}
                      </div>
                      {order.notes && (
                        <p className="mt-2 rounded bg-yellow-50 p-1 text-xs italic">
                          Note: {order.notes}
                        </p>
                      )}
                      <button
                        onClick={() => handleAdvance(order.id, order.status)}
                        className="mt-3 w-full rounded bg-primary py-1.5 text-xs font-medium text-primary-foreground"
                      >
                        {column.status === 'PLACED' && 'Accept'}
                        {column.status === 'ACCEPTED' && 'Start Preparing'}
                        {column.status === 'PREPARING' && 'Mark Ready'}
                        {column.status === 'READY' && 'Mark Served'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
