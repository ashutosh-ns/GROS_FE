'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { restaurantsApi } from '@/lib/api/restaurants';
import { formatPrice } from '@/lib/utils';
import type { Category, MenuItem } from '@/types';

export default function MenuManagementPage() {
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Item form
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (activeRestaurantId) {
      loadData();
    }
  }, [activeRestaurantId]);

  useEffect(() => {
    if (activeRestaurantId) {
      loadMenuItems();
    }
  }, [selectedCategory, search]);

  const loadData = async () => {
    try {
      const [catRes, itemsRes] = await Promise.all([
        restaurantsApi.getCategories(activeRestaurantId!),
        restaurantsApi.getMenuItems(activeRestaurantId!),
      ]);
      setCategories((catRes as any).data || []);
      setMenuItems((itemsRes as any).data || []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    if (!activeRestaurantId) return;
    try {
      const res = await restaurantsApi.getMenuItems(activeRestaurantId, {
        categoryId: selectedCategory || undefined,
        search: search || undefined,
      });
      setMenuItems((res as any).data || []);
    } catch {
      // handle error
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim() || !activeRestaurantId) return;
    try {
      if (editingCategory) {
        await restaurantsApi.updateCategory(activeRestaurantId, editingCategory.id, { name: categoryName });
      } else {
        await restaurantsApi.createCategory(activeRestaurantId, { name: categoryName });
      }
      setCategoryName('');
      setEditingCategory(null);
      setShowCategoryForm(false);
      loadData();
    } catch {
      alert('Failed to save category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Delete this category? Items will not be deleted.')) return;
    try {
      await restaurantsApi.deleteCategory(activeRestaurantId!, categoryId);
      loadData();
    } catch {
      alert('Failed to delete category');
    }
  };

  const handleToggleAvailability = async (itemId: string, current: boolean) => {
    try {
      await restaurantsApi.bulkUpdateAvailability(activeRestaurantId!, [itemId], !current);
      loadMenuItems();
    } catch {
      alert('Failed to update availability');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await restaurantsApi.deleteMenuItem(activeRestaurantId!, itemId);
      loadMenuItems();
    } catch {
      alert('Failed to delete item');
    }
  };

  if (loading) {
    return <div className="p-6">Loading menu...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <button
          onClick={() => setShowItemForm(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + Add Item
        </button>
      </div>

      {/* Categories */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Categories</h2>
          <button
            onClick={() => { setShowCategoryForm(true); setEditingCategory(null); setCategoryName(''); }}
            className="text-sm text-primary hover:underline"
          >
            + Add Category
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-3 py-1 text-sm ${!selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <div key={cat.id} className="group relative">
              <button
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-full px-3 py-1 text-sm ${selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              >
                {cat.name}
              </button>
              <div className="absolute -right-1 -top-1 hidden gap-0.5 group-hover:flex">
                <button
                  onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); setShowCategoryForm(true); }}
                  className="rounded-full bg-blue-500 p-0.5 text-[8px] text-white"
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="rounded-full bg-red-500 p-0.5 text-[8px] text-white"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="mt-4">
        <input
          type="text"
          placeholder="Search menu items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Menu Items Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium">Item</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium">Price</th>
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium">Available</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    {item.image && (
                      <img src={item.image} alt="" className="h-8 w-8 rounded object-cover" />
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.isBestseller && <span className="text-[10px] text-amber-600">Bestseller</span>}
                    </div>
                  </div>
                </td>
                <td className="py-3 text-muted-foreground">
                  {(item as any).category?.name || '-'}
                </td>
                <td className="py-3">
                  {item.discountPrice ? (
                    <div>
                      <span className="font-medium">{formatPrice(item.discountPrice)}</span>
                      <span className="ml-1 text-xs text-muted-foreground line-through">{formatPrice(item.price)}</span>
                    </div>
                  ) : (
                    formatPrice(item.price)
                  )}
                </td>
                <td className="py-3">
                  <span className="text-xs">
                    {item.vegType === 'VEG' ? '🟢 Veg' : item.vegType === 'EGG' ? '🟡 Egg' : '🔴 Non-Veg'}
                  </span>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.isAvailable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.isAvailable ? 'In Stock' : 'Out'}
                  </button>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingItem(item); setShowItemForm(true); }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {menuItems.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No menu items found. Add your first item!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-background p-6">
            <h3 className="text-lg font-bold">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h3>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Category name"
              className="mt-4 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCreateCategory}
                className="flex-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
              >
                {editingCategory ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }}
                className="flex-1 rounded-md border px-3 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      {showItemForm && (
        <MenuItemFormModal
          restaurantId={activeRestaurantId!}
          categories={categories}
          item={editingItem}
          onClose={() => { setShowItemForm(false); setEditingItem(null); }}
          onSaved={() => { setShowItemForm(false); setEditingItem(null); loadMenuItems(); }}
        />
      )}
    </div>
  );
}

function MenuItemFormModal({
  restaurantId,
  categories,
  item,
  onClose,
  onSaved,
}: {
  restaurantId: string;
  categories: Category[];
  item: MenuItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [discountPrice, setDiscountPrice] = useState(item?.discountPrice?.toString() || '');
  const [categoryId, setCategoryId] = useState(item?.categoryId || categories[0]?.id || '');
  const [vegType, setVegType] = useState(item?.vegType || 'VEG');
  const [spiceLevel, setSpiceLevel] = useState(item?.spiceLevel || 'NONE');
  const [prepTime, setPrepTime] = useState(item?.prepTime?.toString() || '');
  const [isRecommended, setIsRecommended] = useState(item?.isRecommended || false);
  const [isBestseller, setIsBestseller] = useState(item?.isBestseller || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !price || !categoryId) {
      alert('Name, price, and category are required');
      return;
    }

    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        name,
        description: description || undefined,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        categoryId,
        vegType,
        spiceLevel,
        prepTime: prepTime ? parseInt(prepTime) : null,
        isRecommended,
        isBestseller,
      };

      if (item) {
        await restaurantsApi.updateMenuItem(restaurantId, item.id, data);
      } else {
        await restaurantsApi.createMenuItem(restaurantId, data);
      }
      onSaved();
    } catch {
      alert('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-background p-6">
        <h3 className="text-lg font-bold">{item ? 'Edit Item' : 'New Menu Item'}</h3>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Price (INR) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Discount Price</label>
              <input
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Prep Time (min)</label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select
                value={vegType}
                onChange={(e) => setVegType(e.target.value)}
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="VEG">Veg</option>
                <option value="NON_VEG">Non-Veg</option>
                <option value="EGG">Egg</option>
                <option value="VEGAN">Vegan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Spice Level</label>
              <select
                value={spiceLevel}
                onChange={(e) => setSpiceLevel(e.target.value)}
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="NONE">None</option>
                <option value="MILD">Mild</option>
                <option value="MEDIUM">Medium</option>
                <option value="HOT">Hot</option>
                <option value="EXTRA_HOT">Extra Hot</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isRecommended}
                onChange={(e) => setIsRecommended(e.target.checked)}
              />
              Recommended
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={(e) => setIsBestseller(e.target.checked)}
              />
              Bestseller
            </label>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {saving ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
          </button>
          <button onClick={onClose} className="flex-1 rounded-md border px-3 py-2 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
