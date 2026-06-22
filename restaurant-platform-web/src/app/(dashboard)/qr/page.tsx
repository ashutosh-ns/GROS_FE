'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { restaurantsApi } from '@/lib/api/restaurants';

interface QrData {
  id: string;
  token: string;
  url: string;
  tableId: string;
  tableNumber: number;
  tableName: string | null;
}

export default function QrCodesPage() {
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);
  const [qrCodes, setQrCodes] = useState<QrData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateAll = async () => {
    if (!activeRestaurantId) return;
    setGenerating(true);
    try {
      const res: any = await restaurantsApi.generateAllQr(activeRestaurantId);
      setQrCodes(res.data || []);
    } catch {
      alert('Failed to generate QR codes');
    } finally {
      setGenerating(false);
    }
  };

  const generateSingle = async (tableId: string) => {
    if (!activeRestaurantId) return;
    try {
      const res: any = await restaurantsApi.generateQr(activeRestaurantId, tableId);
      const newQr = res.data;
      setQrCodes((prev) => {
        const filtered = prev.filter((q) => q.tableId !== tableId);
        return [...filtered, newQr].sort((a, b) => a.tableNumber - b.tableNumber);
      });
    } catch {
      alert('Failed to generate QR');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('QR URL copied to clipboard!');
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">QR Codes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate QR codes for your tables. Customers scan these to start ordering.
          </p>
        </div>
        <button
          onClick={generateAll}
          disabled={generating}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate All QR Codes'}
        </button>
      </div>

      {qrCodes.length === 0 ? (
        <div className="mt-8 rounded-md border p-8 text-center">
          <p className="text-lg font-medium">No QR codes generated yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Click &quot;Generate All QR Codes&quot; to create QR codes for all your active tables.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map((qr) => (
            <div key={qr.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold">Table {qr.tableNumber}</span>
                  {qr.tableName && (
                    <span className="ml-2 text-sm text-muted-foreground">({qr.tableName})</span>
                  )}
                </div>
              </div>

              {/* QR Code placeholder (actual QR image would use a library) */}
              <div className="mt-3 flex aspect-square items-center justify-center rounded-md border bg-white">
                <div className="text-center">
                  <div className="text-4xl">📱</div>
                  <p className="mt-2 text-xs text-muted-foreground">QR Code</p>
                  <p className="mt-1 text-[10px] text-muted-foreground break-all px-2">
                    {qr.url.substring(0, 60)}...
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => copyUrl(qr.url)}
                  className="flex-1 rounded-md border px-3 py-1.5 text-xs hover:bg-accent"
                >
                  Copy URL
                </button>
                <button
                  onClick={() => generateSingle(qr.tableId)}
                  className="flex-1 rounded-md border px-3 py-1.5 text-xs hover:bg-accent"
                >
                  Regenerate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Print instructions */}
      {qrCodes.length > 0 && (
        <div className="mt-8 rounded-md border bg-muted p-4">
          <h3 className="font-medium">How to use</h3>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
            <li>Generate QR codes for all your tables</li>
            <li>Copy each QR URL and create a QR image using any QR generator</li>
            <li>Print and place QR codes on each table</li>
            <li>Customers scan to start ordering instantly</li>
          </ol>
        </div>
      )}
    </div>
  );
}
