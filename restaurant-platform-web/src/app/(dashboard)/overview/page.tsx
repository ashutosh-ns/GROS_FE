'use client';

import { useAuthStore } from '@/lib/stores/auth-store';

export default function DashboardOverviewPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome back, {user?.firstName}! Here&apos;s your restaurant overview.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Orders" value="0" />
        <StatCard title="Revenue Today" value="₹0" />
        <StatCard title="Active Tables" value="0/10" />
        <StatCard title="Pending Orders" value="0" />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        <div className="mt-4 rounded-md border p-8 text-center text-muted-foreground">
          No orders yet. Share QR codes with customers to get started.
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
