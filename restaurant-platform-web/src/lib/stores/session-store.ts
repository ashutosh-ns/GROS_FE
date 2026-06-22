import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
  sessionToken: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  restaurantLogo: string | null;
  tableId: string | null;
  tableNumber: number | null;
  tableName: string | null;
  expiresAt: string | null;

  setSession: (data: {
    sessionToken: string;
    restaurant: { id: string; name: string; logo: string | null };
    table: { id: string; number: number; name: string | null };
    expiresIn: number;
  }) => void;
  clearSession: () => void;
  isValid: () => boolean;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessionToken: null,
      restaurantId: null,
      restaurantName: null,
      restaurantLogo: null,
      tableId: null,
      tableNumber: null,
      tableName: null,
      expiresAt: null,

      setSession: (data) =>
        set({
          sessionToken: data.sessionToken,
          restaurantId: data.restaurant.id,
          restaurantName: data.restaurant.name,
          restaurantLogo: data.restaurant.logo,
          tableId: data.table.id,
          tableNumber: data.table.number,
          tableName: data.table.name,
          expiresAt: new Date(Date.now() + data.expiresIn * 1000).toISOString(),
        }),

      clearSession: () =>
        set({
          sessionToken: null,
          restaurantId: null,
          restaurantName: null,
          restaurantLogo: null,
          tableId: null,
          tableNumber: null,
          tableName: null,
          expiresAt: null,
        }),

      isValid: () => {
        const { sessionToken, expiresAt } = get();
        if (!sessionToken || !expiresAt) return false;
        return new Date(expiresAt) > new Date();
      },
    }),
    {
      name: 'session-storage',
    },
  ),
);
