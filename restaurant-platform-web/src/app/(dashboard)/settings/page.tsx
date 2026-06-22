'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { restaurantsApi } from '@/lib/api/restaurants';

interface RestaurantSettings {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  gstNumber: string | null;
  taxRate: number;
  openingTime: string | null;
  closingTime: string | null;
  isActive: boolean;
}

export default function SettingsPage() {
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    gstNumber: '',
    taxRate: '5',
    openingTime: '',
    closingTime: '',
  });

  useEffect(() => {
    if (activeRestaurantId) loadSettings();
  }, [activeRestaurantId]);

  const loadSettings = async () => {
    try {
      const res: any = await restaurantsApi.getRestaurant(activeRestaurantId!);
      const data = res.data;
      setSettings(data);
      setForm({
        name: data.name || '',
        description: data.description || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        phone: data.phone || '',
        email: data.email || '',
        gstNumber: data.gstNumber || '',
        taxRate: (data.taxRate || 5).toString(),
        openingTime: data.openingTime || '',
        closingTime: data.closingTime || '',
      });
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await restaurantsApi.updateRestaurant(activeRestaurantId!, {
        name: form.name,
        description: form.description || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        gstNumber: form.gstNumber || undefined,
        taxRate: parseFloat(form.taxRate) || 5,
        openingTime: form.openingTime || undefined,
        closingTime: form.closingTime || undefined,
      });
      alert('Settings saved!');
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Restaurant Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your restaurant details and configuration.
      </p>

      <div className="mt-6 space-y-6">
        {/* Basic Info */}
        <section>
          <h2 className="text-lg font-semibold">Basic Information</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium">Restaurant Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Slug</label>
              <p className="mt-1 text-sm text-muted-foreground">{settings?.slug}</p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-lg font-semibold">Contact</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </section>

        {/* Address */}
        <section>
          <h2 className="text-lg font-semibold">Address</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium">Street Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Pincode</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Business */}
        <section>
          <h2 className="text-lg font-semibold">Business Details</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">GST Number</label>
              <input
                type="text"
                value={form.gstNumber}
                onChange={(e) => handleChange('gstNumber', e.target.value)}
                placeholder="22AAAAA0000A1Z5"
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Tax Rate (%)</label>
              <input
                type="number"
                value={form.taxRate}
                onChange={(e) => handleChange('taxRate', e.target.value)}
                min={0}
                max={28}
                step={0.5}
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </section>

        {/* Operating Hours */}
        <section>
          <h2 className="text-lg font-semibold">Operating Hours</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Opening Time</label>
              <input
                type="time"
                value={form.openingTime}
                onChange={(e) => handleChange('openingTime', e.target.value)}
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Closing Time</label>
              <input
                type="time"
                value={form.closingTime}
                onChange={(e) => handleChange('closingTime', e.target.value)}
                className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </section>

        {/* Status */}
        <section>
          <h2 className="text-lg font-semibold">Status</h2>
          <div className="mt-3 flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${settings?.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">{settings?.isActive ? 'Restaurant is Active' : 'Restaurant is Inactive'}</span>
          </div>
        </section>

        {/* Save Button */}
        <div className="border-t pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
