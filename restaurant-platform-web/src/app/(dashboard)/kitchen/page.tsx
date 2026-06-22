'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { restaurantsApi } from '@/lib/api/restaurants';
import { useKitchenSocket } from '@/lib/hooks/use-socket';
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
  const { socket, connected } = useKitchenSocket(activeRestaurantId);

  const loadOrders = useCallback(async () => {
    if (!activeRestaurantId) return;
    try {
      const res: any = await restaurantsApi.getOrders(activeRestaurantId, { limit: '100' });
      const allOrders = res.data?.data || [];
      const activeOrders = allOrders.filter((o: Order) =>
        ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status),
      );
      setOrders(activeOrders);
      prevCountRef.current = activeOrders.length;
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [activeRestaurantId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // WebSocket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order: any) => {
      setOrders((prev) => {
        if (prev.find((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
      // Play notification sound
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
      } catch {}
    };

    const handleStatusUpdate = (order: any) => {
      setOrders((prev) => {
        const activeStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'];
        if (!activeStatuses.includes(order.status)) {
          return prev.filter((o) => o.id !== order.id);
        }
        return prev.map((o) => (o.id === order.id ? { ...o, ...order } : o));
      });
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:status', handleStatusUpdate);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:status', handleStatusUpdate);
    };
  }, [socket]);

  // Fallback polling (in case WebSocket disconnects)
  useEffect(() => {
    if (connected) return;
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [connected, loadOrders]);

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
      // Optimistic update
      setOrders((prev) => {
        if (nextStatus === 'SERVED') {
          return prev.filter((o) => o.id !== orderId);
        }
        return prev.map((o) =>
          o.id === orderId ? { ...o, status: nextStatus as OrderStatus } : o,
        );
      });
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
          <span className={`h-2 w-2 rounded-full ${connected ? 'animate-pulse bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-sm text-muted-foreground">
            {connected ? 'Live (WebSocket)' : 'Polling (5s)'}
          </span>
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
