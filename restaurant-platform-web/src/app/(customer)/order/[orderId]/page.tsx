'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/stores/session-store';
import { useCustomerSocket } from '@/lib/hooks/use-socket';
import { formatPrice, formatTime } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const statusSteps: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'PLACED', label: 'Order Placed', icon: '📝' },
  { status: 'ACCEPTED', label: 'Accepted', icon: '✅' },
  { status: 'PREPARING', label: 'Preparing', icon: '👨‍🍳' },
  { status: 'READY', label: 'Ready', icon: '🍽️' },
  { status: 'SERVED', label: 'Served', icon: '🎉' },
];

function getStatusIndex(status: OrderStatus): number {
  if (status === 'CANCELLED') return -1;
  if (status === 'COMPLETED') return statusSteps.length;
  return statusSteps.findIndex((s) => s.status === status);
}

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { sessionToken, isValid } = useSessionStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket, connected } = useCustomerSocket(sessionToken);

  const fetchOrder = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${API_URL}/customer/orders/${orderId}`, {
        headers: { 'X-Session-Token': sessionToken! },
      });

      if (!response.ok) throw new Error('Failed to fetch order');

      const result = await response.json();
      setOrder(result.data);
    } catch {
      // silent retry
    } finally {
      setLoading(false);
    }
  }, [orderId, sessionToken]);

  useEffect(() => {
    if (!isValid()) {
      router.push('/');
      return;
    }
    fetchOrder();
  }, [orderId, isValid, router, fetchOrder]);

  // WebSocket real-time status updates
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: { orderId: string; status: OrderStatus }) => {
      if (data.orderId === orderId) {
        setOrder((prev) => (prev ? { ...prev, status: data.status } : null));
      }
    };

    socket.on('order:status', handleStatusUpdate);
    return () => { socket.off('order:status', handleStatusUpdate); };
  }, [socket, orderId]);

  // Fallback polling when WebSocket is disconnected
  useEffect(() => {
    if (connected) return;
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [connected, fetchOrder]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold">Order not found</h1>
          <button
            onClick={() => router.push('/menu')}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = getStatusIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-xs text-muted-foreground">
            Placed at {formatTime(order.placedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${connected ? 'animate-pulse bg-green-500' : 'bg-yellow-500'}`} />
          <button
            onClick={() => router.push('/menu')}
            className="rounded-md border px-3 py-1 text-sm"
          >
            Order More
          </button>
        </div>
      </div>

      {/* Status tracker */}
      {isCancelled ? (
        <div className="mt-6 rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
          <span className="text-2xl">❌</span>
          <p className="mt-2 font-medium text-destructive">Order Cancelled</p>
        </div>
      ) : (
        <div className="mt-6 space-y-0">
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={step.status} className="flex gap-3">
                {/* Line & dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    {step.icon}
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`h-8 w-0.5 ${
                        index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="flex items-center pb-8">
                  <span
                    className={`text-sm ${
                      isCompleted ? 'font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order items */}
      <div className="mt-6">
        <h2 className="font-semibold">Items</h2>
        <div className="mt-2 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <span>
                  {item.quantity}x {item.menuItem.name}
                </span>
                {item.variant && (
                  <span className="text-muted-foreground"> ({item.variant.name})</span>
                )}
              </div>
              <span>{formatPrice(item.totalPrice)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="mt-4 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        {order.tax > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Tax</span>
            <span>{formatPrice(order.tax)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between font-bold">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Request bill */}
      {(order.status === 'SERVED' || order.status === 'COMPLETED') && (
        <button
          onClick={() => alert('Bill request sent to the waiter!')}
          className="mt-6 w-full rounded-md border-2 border-primary py-3 text-sm font-medium text-primary"
        >
          Request Bill
        </button>
      )}
    </div>
  );
}
