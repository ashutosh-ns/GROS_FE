'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/admin';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  platformRole: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { memberships: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    try {
      const params: Record<string, string> = { page: page.toString(), limit: '20' };
      if (search) params.search = search;

      const res: any = await adminApi.listUsers(params);
      setUsers(res.data?.data || []);
      setTotalPages(res.data?.meta?.totalPages || 1);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await adminApi.toggleUserActive(id);
      loadUsers();
    } catch {
      alert('Failed to toggle user status');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) return <div className="p-6">Loading users...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>

      <div className="mt-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email..."
          className="w-full max-w-sm rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-center">Restaurants</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Last Login</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.firstName} {u.lastName || ''}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  {u.platformRole ? (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                      {u.platformRole}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">User</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">{u._count.memberships}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleToggle(u.id)}
                    className="rounded border px-2 py-1 text-xs hover:bg-accent"
                    disabled={u.platformRole === 'SUPER_ADMIN'}
                  >
                    {u.isActive ? 'Disable' : 'Enable'}
                  </button>
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
