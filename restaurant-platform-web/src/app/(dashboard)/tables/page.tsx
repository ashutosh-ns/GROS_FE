'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { restaurantsApi } from '@/lib/api/restaurants';

interface Table {
  id: string;
  number: number;
  name: string | null;
  capacity: number;
  isActive: boolean;
  _count?: { sessions: number };
}

export default function TablesPage() {
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [tableName, setTableName] = useState('');
  const [tableCapacity, setTableCapacity] = useState('4');

  useEffect(() => {
    if (activeRestaurantId) loadTables();
  }, [activeRestaurantId]);

  const loadTables = async () => {
    try {
      const res: any = await restaurantsApi.getTables(activeRestaurantId!);
      setTables(res.data || []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tableNumber && !editingTable) {
      alert('Table number is required');
      return;
    }
    try {
      if (editingTable) {
        await restaurantsApi.updateTable(activeRestaurantId!, editingTable.id, {
          name: tableName || undefined,
          capacity: parseInt(tableCapacity) || 4,
        });
      } else {
        await restaurantsApi.createTable(activeRestaurantId!, {
          number: parseInt(tableNumber),
          name: tableName || undefined,
          capacity: parseInt(tableCapacity) || 4,
        });
      }
      setShowForm(false);
      setEditingTable(null);
      resetForm();
      loadTables();
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Failed to save table');
    }
  };

  const handleDelete = async (tableId: string) => {
    if (!confirm('Delete this table?')) return;
    try {
      await restaurantsApi.deleteTable(activeRestaurantId!, tableId);
      loadTables();
    } catch {
      alert('Failed to delete table');
    }
  };

  const handleToggleActive = async (table: Table) => {
    try {
      await restaurantsApi.updateTable(activeRestaurantId!, table.id, { isActive: !table.isActive });
      loadTables();
    } catch {
      alert('Failed to update table');
    }
  };

  const resetForm = () => {
    setTableNumber('');
    setTableName('');
    setTableCapacity('4');
  };

  if (loading) return <div className="p-6">Loading tables...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tables</h1>
        <button
          onClick={() => { setShowForm(true); setEditingTable(null); resetForm(); }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + Add Table
        </button>
      </div>

      {/* Tables grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`rounded-lg border p-4 ${table.isActive ? 'border-border' : 'border-dashed opacity-50'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{table.number}</span>
              {(table._count?.sessions || 0) > 0 && (
                <span className="h-2 w-2 rounded-full bg-green-500" title="Active session" />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{table.name || `Table ${table.number}`}</p>
            <p className="text-xs text-muted-foreground">Capacity: {table.capacity}</p>
            <div className="mt-3 flex gap-1">
              <button
                onClick={() => {
                  setEditingTable(table);
                  setTableNumber(table.number.toString());
                  setTableName(table.name || '');
                  setTableCapacity(table.capacity.toString());
                  setShowForm(true);
                }}
                className="rounded border px-2 py-0.5 text-xs hover:bg-accent"
              >
                Edit
              </button>
              <button
                onClick={() => handleToggleActive(table)}
                className="rounded border px-2 py-0.5 text-xs hover:bg-accent"
              >
                {table.isActive ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => handleDelete(table.id)}
                className="rounded border px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {tables.length === 0 && (
          <div className="col-span-full rounded-md border p-8 text-center text-muted-foreground">
            No tables yet. Add your first table!
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-background p-6">
            <h3 className="text-lg font-bold">{editingTable ? 'Edit Table' : 'Add Table'}</h3>
            <div className="mt-4 space-y-3">
              {!editingTable && (
                <div>
                  <label className="block text-sm font-medium">Table Number *</label>
                  <input
                    type="number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium">Name (optional)</label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="e.g. Window Seat, VIP"
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Capacity</label>
                <input
                  type="number"
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(e.target.value)}
                  min={1}
                  max={20}
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={handleSave} className="flex-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
                {editingTable ? 'Update' : 'Add'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingTable(null); }} className="flex-1 rounded-md border px-3 py-2 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
