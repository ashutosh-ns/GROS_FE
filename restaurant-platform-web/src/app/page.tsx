import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">RestaurantOS</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          QR-based ordering platform for restaurants
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/login"
            className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Restaurant Login
          </Link>
          <Link
            href="/admin/overview"
            className="rounded-md border px-6 py-3 text-sm font-medium hover:bg-accent"
          >
            Admin Panel
          </Link>
        </div>
      </div>
    </div>
  );
}
