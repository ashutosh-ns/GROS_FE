import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  platformRole: string | null;
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeRestaurantId: string | null;
  restaurants: Restaurant[];
  isAuthenticated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setRestaurants: (restaurants: Restaurant[]) => void;
  setActiveRestaurant: (restaurantId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      activeRestaurantId: null,
      restaurants: [],
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      setRestaurants: (restaurants) =>
        set((state) => ({
          restaurants,
          activeRestaurantId: state.activeRestaurantId || restaurants[0]?.id || null,
        })),

      setActiveRestaurant: (restaurantId) => set({ activeRestaurantId: restaurantId }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          activeRestaurantId: null,
          restaurants: [],
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        activeRestaurantId: state.activeRestaurantId,
        restaurants: state.restaurants,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
