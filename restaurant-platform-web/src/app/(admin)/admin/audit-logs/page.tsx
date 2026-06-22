'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/admin';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  restaurantId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { email: string; firstName: string } | null;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadLogs();
  }, [page, entityFilter, actionFilter]);

  const loadLogs = async () => {
    try {
      const params: Record<string, string> = { page: page.toString(), limit: '30' };
      if (entityFilter) params.entity = entityFilter;
      if (actionFilter) params.action = actionFilter;

      const res: any = await adminApi.getAuditLogs(params);
      setLogs(res.data?.data || []);
      setTotalPages(res.data?.meta?.totalPages || 1);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <div className="p-6">Loading audit logs...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Audit Logs</h1>

      <div className="mt-4 flex gap-3">
        <input
          type="text"
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          placeholder="Filter by entity..."
          className="rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="text"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          placeholder="Filter by action..."
          className="rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left">Timestamp</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Entity</th>
              <th className="px-4 py-3 text-left">Entity ID</th>
              <th className="px-4 py-3 text-left">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {log.user ? (
                      <span>{log.user.firstName} ({log.user.email})</span>
                    ) : (
                      <span className="text-muted-foreground">System</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">{log.entity}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {log.entityId ? log.entityId.substring(0, 8) + '...' : '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{log.ipAddress || '-'}</td>
                </tr>
              ))
            )}
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
