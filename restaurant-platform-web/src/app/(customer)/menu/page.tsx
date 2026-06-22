'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/stores/session-store';
import { useCartStore, CartItem } from '@/lib/stores/cart-store';
import { formatPrice } from '@/lib/utils';
import type { Category, MenuItem } from '@/types';

export default function MenuPage() {
  const router = useRouter();
  const { sessionToken, restaurantId, restaurantName, tableNumber, isValid } = useSessionStore();
  const { items: cartItems, addItem, getItemCount, getSubtotal } = useCartStore();
  const [categories, setCategories] = useState<(Category & { menuItems: MenuItem[] })[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (!isValid()) {
      router.push('/');
      return;
    }
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${API_URL}/menu`, {
        headers: { 'X-Session-Token': sessionToken! },
      });

      if (!response.ok) throw new Error('Failed to load menu');

      const result = await response.json();
      setCategories(result.data);
      if (result.data.length > 0) {
        setActiveCategory(result.data[0].id);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItem, variantId?: string) => {
    const variant = variantId ? item.variants.find((v) => v.id === variantId) : null;

    const cartItem: CartItem = {
      menuItemId: item.id,
      name: item.name,
      price: item.discountPrice || item.price,
      image: item.image,
      vegType: item.vegType,
      quantity: 1,
      variantId: variant?.id || null,
      variantName: variant?.name || null,
      variantPriceAdjustment: variant?.priceAdjustment || 0,
      addOns: [],
      notes: '',
    };

    addItem(cartItem);
    setSelectedItem(null);
  };

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    menuItems: cat.menuItems.filter(
      (item) =>
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()),
    ),
  }));

  const activeItems =
    activeCategory && !search
      ? filteredCategories.find((c) => c.id === activeCategory)?.menuItems || []
      : filteredCategories.flatMap((c) => c.menuItems);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{restaurantName}</h1>
            <p className="text-xs text-muted-foreground">Table {tableNumber}</p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search food..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="sticky top-[105px] z-10 flex gap-2 overflow-x-auto border-b bg-background px-4 py-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Menu items */}
      <div className="flex-1 p-4">
        {activeItems.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {search ? 'No items match your search' : 'No items available'}
          </div>
        ) : (
          <div className="space-y-4">
            {activeItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAdd={() =>
                  item.variants.length > 0 ? setSelectedItem(item) : handleAddToCart(item)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart bar */}
      {getItemCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t bg-primary p-4">
          <button
            onClick={() => router.push('/cart')}
            className="flex w-full items-center justify-between text-primary-foreground"
          >
            <span className="text-sm font-medium">
              {getItemCount()} item{getItemCount() > 1 ? 's' : ''} added
            </span>
            <span className="flex items-center gap-2">
              <span className="font-bold">{formatPrice(getSubtotal())}</span>
              <span className="text-sm">View Cart &rarr;</span>
            </span>
          </button>
        </div>
      )}

      {/* Variant selection modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-xl bg-background p-6">
            <h3 className="text-lg font-bold">{selectedItem.name}</h3>
            <p className="text-sm text-muted-foreground">Choose a variant</p>
            <div className="mt-4 space-y-2">
              {selectedItem.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => handleAddToCart(selectedItem, variant.id)}
                  className="flex w-full items-center justify-between rounded-md border p-3 hover:bg-accent"
                >
                  <span>{variant.name}</span>
                  <span className="text-sm font-medium">
                    {formatPrice((selectedItem.discountPrice || selectedItem.price) + variant.priceAdjustment)}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="mt-4 w-full rounded-md border py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  const vegBadge = item.vegType === 'VEG' ? '🟢' : item.vegType === 'EGG' ? '🟡' : '🔴';

  return (
    <div className="flex gap-3 rounded-lg border p-3">
      <div className="flex-1">
        <div className="flex items-center gap-1">
          <span className="text-xs">{vegBadge}</span>
          {item.isBestseller && (
            <span className="rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700">
              Bestseller
            </span>
          )}
          {item.isRecommended && (
            <span className="rounded bg-green-100 px-1 text-[10px] font-medium text-green-700">
              Recommended
            </span>
          )}
        </div>
        <h3 className="mt-1 font-medium">{item.name}</h3>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <span className="font-semibold">{formatPrice(item.discountPrice || item.price)}</span>
          {item.discountPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(item.price)}
            </span>
          )}
        </div>
        {item.prepTime && (
          <p className="mt-1 text-[10px] text-muted-foreground">{item.prepTime} min</p>
        )}
      </div>

      <div className="flex flex-col items-center">
        {item.image && (
          <div className="h-20 w-20 overflow-hidden rounded-md bg-muted">
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          </div>
        )}
        <button
          onClick={onAdd}
          className="mt-2 rounded-md border border-primary px-4 py-1 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground"
        >
          ADD
        </button>
      </div>
    </div>
  );
}
