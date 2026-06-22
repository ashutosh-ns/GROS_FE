'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { restaurantsApi } from '@/lib/api/restaurants';
import { useStaffSocket } from '@/lib/hooks/use-socket';
import { formatPrice, formatTime } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const STATUS_OPTIONS: OrderStatus[] = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];

const STATUS_COLORS: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-indigo-100 text-indigo-700',
  PREPARING: 'bg-yellow-100 text-yellow-700',
  READY: 'bg-green-100 text-green-700',
  SERVED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [billRequests, setBillRequests] = useState<{ tableNumber: number; sessionId: string }[]>([]);
  const { socket, connected } = useStaffSocket(activeRestaurantId);

  const loadOrders = useCallback(async () => {
    if (!activeRestaurantId) return;
    try {
      const params: Record<string, string> = { page: page.toString(), limit: '20' };
      if (statusFilter) params.status = statusFilter;

      const res: any = await restaurantsApi.getOrders(activeRestaurantId, params);
      setOrders(res.data?.data || []);
      setTotalPages(res.data?.meta?.totalPages || 1);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [activeRestaurantId, statusFilter, page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // WebSocket: new orders and status updates
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order: any) => {
      if (!statusFilter || order.status === statusFilter) {
        setOrders((prev) => {
          if (prev.find((o) => o.id === order.id)) return prev;
          return [order, ...prev];
        });
      }
    };

    const handleStatusUpdate = (order: any) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, ...order } : o)),
      );
      if (selectedOrder?.id === order.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, ...order } : null));
      }
    };

    const handleBillRequest = (data: { tableNumber: number; sessionId: string }) => {
      setBillRequests((prev) => [...prev, data]);
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:status', handleStatusUpdate);
    socket.on('bill:request', handleBillRequest);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:status', handleStatusUpdate);
      socket.off('bill:request', handleBillRequest);
    };
  }, [socket, statusFilter, selectedOrder?.id]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await restaurantsApi.updateOrderStatus(activeRestaurantId!, orderId, newStatus);
      loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus as OrderStatus } : null));
      }
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Failed to update status');
    }
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    const flow: Record<string, string> = {
      PLACED: 'ACCEPTED',
      ACCEPTED: 'PREPARING',
      PREPARING: 'READY',
      READY: 'SERVED',
      SERVED: 'COMPLETED',
    };
    return (flow[current] as OrderStatus) || null;
  };

  const dismissBillRequest = (index: number) => {
    setBillRequests((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) return <div className="p-6">Loading orders...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${connected ? 'animate-pulse bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-xs text-muted-foreground">
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Bill request notifications */}
      {billRequests.length > 0 && (
        <div className="mt-4 space-y-2">
          {billRequests.map((req, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border border-orange-300 bg-orange-50 p-3">
              <span className="text-sm font-medium">
                🧾 Table {req.tableNumber} requested the bill
              </span>
              <button
                onClick={() => dismissBillRequest(i)}
                className="rounded border px-2 py-0.5 text-xs"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={`rounded-full px-3 py-1 text-sm ${!statusFilter ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          All
        </button>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`rounded-full px-3 py-1 text-sm ${statusFilter === status ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="mt-6 space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            No orders found.
          </div>
        ) : (
          orders.map((order) => {
            const nextStatus = getNextStatus(order.status);
            return (
              <div
                key={order.id}
                className="cursor-pointer rounded-lg border p-4 transition hover:border-primary"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">#{order.orderNumber}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Table {(order as any).table?.number || '-'} &middot; {formatTime(order.placedAt)} &middot; {order.items?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(order.total)}</p>
                    {nextStatus && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, nextStatus); }}
                        className="mt-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
                      >
                        Mark {nextStatus}
                      </button>
                    )}
                  </div>
                </div>
                {order.items && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {order.items.map((i) => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Order #{selectedOrder.orderNumber}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-lg">&times;</button>
            </div>
            <div className="mt-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[selectedOrder.status]}`}>
                {selectedOrder.status}
              </span>
              <span className="ml-2 text-sm text-muted-foreground">
                Table {(selectedOrder as any).table?.number}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.menuItem.name} {item.variant ? `(${item.variant.name})` : ''}</span>
                  <span>{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>
            {selectedOrder.notes && (
              <p className="mt-3 text-sm italic text-muted-foreground">Notes: {selectedOrder.notes}</p>
            )}
            <div className="mt-4 border-t pt-3">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>
            {getNextStatus(selectedOrder.status) && (
              <button
                onClick={() => handleStatusUpdate(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                className="mt-4 w-full rounded-md bg-primary py-2 text-sm text-primary-foreground"
              >
                Mark as {getNextStatus(selectedOrder.status)}
              </button>
            )}
            {(selectedOrder.status === 'PLACED' || selectedOrder.status === 'ACCEPTED') && (
              <button
                onClick={() => { handleStatusUpdate(selectedOrder.id, 'CANCELLED'); setSelectedOrder(null); }}
                className="mt-2 w-full rounded-md border border-destructive py-2 text-sm text-destructive"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
