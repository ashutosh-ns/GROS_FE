import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  image: string | null;
  vegType: string;
  quantity: number;
  variantId: string | null;
  variantName: string | null;
  variantPriceAdjustment: number;
  addOns: Array<{ id: string; name: string; price: number }>;
  notes: string;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;

  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string, variantId: string | null) => void;
  updateQuantity: (menuItemId: string, variantId: string | null, quantity: number) => void;
  updateNotes: (menuItemId: string, variantId: string | null, notes: string) => void;
  clearCart: () => void;
  setRestaurantId: (id: string) => void;

  getItemCount: () => number;
  getSubtotal: () => number;
}

function getItemKey(menuItemId: string, variantId: string | null): string {
  return `${menuItemId}:${variantId || 'none'}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,

      addItem: (item) =>
        set((state) => {
          const key = getItemKey(item.menuItemId, item.variantId);
          const existingIndex = state.items.findIndex(
            (i) => getItemKey(i.menuItemId, i.variantId) === key,
          );

          if (existingIndex >= 0) {
            const updated = [...state.items];
            updated[existingIndex] = {
              ...updated[existingIndex]!,
              quantity: updated[existingIndex]!.quantity + item.quantity,
            };
            return { items: updated };
          }

          return { items: [...state.items, item] };
        }),

      removeItem: (menuItemId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => getItemKey(i.menuItemId, i.variantId) !== getItemKey(menuItemId, variantId),
          ),
        })),

      updateQuantity: (menuItemId, variantId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (i) => getItemKey(i.menuItemId, i.variantId) !== getItemKey(menuItemId, variantId),
              ),
            };
          }
          return {
            items: state.items.map((i) =>
              getItemKey(i.menuItemId, i.variantId) === getItemKey(menuItemId, variantId)
                ? { ...i, quantity }
                : i,
            ),
          };
        }),

      updateNotes: (menuItemId, variantId, notes) =>
        set((state) => ({
          items: state.items.map((i) =>
            getItemKey(i.menuItemId, i.variantId) === getItemKey(menuItemId, variantId)
              ? { ...i, notes }
              : i,
          ),
        })),

      clearCart: () => set({ items: [] }),

      setRestaurantId: (id) => set({ restaurantId: id }),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, item) => {
          const itemPrice = item.price + item.variantPriceAdjustment;
          const addOnTotal = item.addOns.reduce((a, addon) => a + addon.price, 0);
          return sum + (itemPrice + addOnTotal) * item.quantity;
        }, 0),
    }),
    {
      name: 'cart-storage',
    },
  ),
);
