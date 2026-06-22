'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/stores/session-store';
import { useCartStore } from '@/lib/stores/cart-store';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const { sessionToken, restaurantName, tableNumber, isValid } = useSessionStore();
  const { items, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
  const [orderNotes, setOrderNotes] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  if (!isValid()) {
    router.push('/');
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-4xl">🛒</div>
        <h1 className="mt-4 text-xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add items from the menu to get started</p>
        <button
          onClick={() => router.push('/menu')}
          className="mt-6 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  const subtotal = getSubtotal();

  const placeOrder = async () => {
    setIsPlacing(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const orderPayload = {
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          variantId: item.variantId,
          quantity: item.quantity,
          notes: item.notes || undefined,
          addOnIds: item.addOns.map((a) => a.id),
        })),
        notes: orderNotes || undefined,
      };

      const response = await fetch(`${API_URL}/customer/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken!,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to place order');
      }

      const result = await response.json();
      clearCart();
      router.push(`/order/${result.data.id}`);
    } catch (error: any) {
      alert(error.message || 'Failed to place order');
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/menu')} className="text-lg">
            &larr;
          </button>
          <div>
            <h1 className="text-lg font-bold">Your Cart</h1>
            <p className="text-xs text-muted-foreground">
              {restaurantName} &middot; Table {tableNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Cart items */}
      <div className="flex-1 p-4">
        <div className="space-y-3">
          {items.map((item) => {
            const itemKey = `${item.menuItemId}:${item.variantId || 'none'}`;
            const unitPrice =
              item.price +
              item.variantPriceAdjustment +
              item.addOns.reduce((sum, a) => sum + a.price, 0);

            return (
              <div key={itemKey} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">
                      {item.vegType === 'VEG' ? '🟢' : item.vegType === 'EGG' ? '🟡' : '🔴'}
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {item.variantName && (
                    <p className="text-xs text-muted-foreground">{item.variantName}</p>
                  )}
                  {item.addOns.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      + {item.addOns.map((a) => a.name).join(', ')}
                    </p>
                  )}
                  <p className="mt-1 text-sm font-semibold">{formatPrice(unitPrice * item.quantity)}</p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-2 rounded-md border">
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.variantId, item.quantity - 1)}
                    className="px-2 py-1 text-lg"
                  >
                    -
                  </button>
                  <span className="min-w-[20px] text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.variantId, item.quantity + 1)}
                    className="px-2 py-1 text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order notes */}
        <div className="mt-6">
          <label className="block text-sm font-medium">Special instructions</label>
          <textarea
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Any special requests for the kitchen..."
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            rows={2}
            maxLength={500}
          />
        </div>
      </div>

      {/* Order summary & place order */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t bg-background p-4">
        <div className="mb-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Taxes</span>
            <span>Calculated at billing</span>
          </div>
        </div>
        <button
          onClick={placeOrder}
          disabled={isPlacing}
          className="w-full rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPlacing ? 'Placing order...' : `Place Order • ${formatPrice(subtotal)}`}
        </button>
      </div>
    </div>
  );
}
