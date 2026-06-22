'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { formatPrice } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number; members: number; tables: number };
  subscription: { plan: { name: string }; status: string } | null;
}

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { setAuth } = useAuthStore();

  useEffect(() => {
    loadRestaurants();
  }, [page, search]);

  const loadRestaurants = async () => {
    try {
      const params: Record<string, string> = { page: page.toString(), limit: '15' };
      if (search) params.search = search;

      const res: any = await adminApi.listRestaurants(params);
      setRestaurants(res.data?.data || []);
      setTotalPages(res.data?.meta?.totalPages || 1);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await adminApi.toggleRestaurantActive(id);
      loadRestaurants();
    } catch {
      alert('Failed to toggle status');
    }
  };

  const handleImpersonate = async (id: string) => {
    try {
      const res: any = await adminApi.impersonate(id);
      const { token, restaurantId } = res.data;
      // Store token and redirect
      alert(`Impersonation token generated for restaurant. Token: ${token.substring(0, 20)}...`);
    } catch {
      alert('Failed to impersonate');
    }
  };

  if (loading) return <div className="p-6">Loading restaurants...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Restaurants</h1>

      <div className="mt-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, city..."
          className="w-full max-w-sm rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left">Restaurant</th>
              <th className="px-4 py-3 text-left">City</th>
              <th className="px-4 py-3 text-center">Tables</th>
              <th className="px-4 py-3 text-center">Orders</th>
              <th className="px-4 py-3 text-center">Staff</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.slug}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.city || '-'}</td>
                <td className="px-4 py-3 text-center">{r._count.tables}</td>
                <td className="px-4 py-3 text-center">{r._count.orders}</td>
                <td className="px-4 py-3 text-center">{r._count.members}</td>
                <td className="px-4 py-3">
                  {r.subscription ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      {r.subscription.plan.name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No plan</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {r.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => handleToggle(r.id)}
                      className="rounded border px-2 py-1 text-xs hover:bg-accent"
                    >
                      {r.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleImpersonate(r.id)}
                      className="rounded border px-2 py-1 text-xs hover:bg-accent"
                    >
                      Impersonate
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
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
    </div>
  );
}
