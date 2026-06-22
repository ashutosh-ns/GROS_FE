'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { restaurantsApi } from '@/lib/api/restaurants';
import { formatPrice } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number | null;
  maxTables: number | null;
  maxStaff: number | null;
  features: string[];
  isActive: boolean;
}

interface Subscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  plan: Plan;
}

interface Invoice {
  id: string;
  amount: number;
  tax: number;
  total: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  subscription: { plan: { name: string } };
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  TRIALING: 'bg-blue-100 text-blue-700',
  PAST_DUE: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-700',
};

export default function BillingPage() {
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (activeRestaurantId) loadBilling();
  }, [activeRestaurantId]);

  const loadBilling = async () => {
    try {
      const [plansRes, subRes, invoicesRes] = await Promise.all([
        restaurantsApi.getPlans(),
        restaurantsApi.getSubscription(activeRestaurantId!),
        restaurantsApi.getInvoices(activeRestaurantId!),
      ]);

      setPlans((plansRes as any).data || []);
      setSubscription((subRes as any).data || null);
      setInvoices((invoicesRes as any).data || []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      await restaurantsApi.createSubscription(activeRestaurantId!, planId);
      loadBilling();
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Failed to subscribe');
    }
  };

  const handleChangePlan = async (planId: string) => {
    if (!confirm('Change to this plan?')) return;
    try {
      await restaurantsApi.changePlan(activeRestaurantId!, planId);
      loadBilling();
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Failed to change plan');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    try {
      await restaurantsApi.cancelSubscription(activeRestaurantId!);
      loadBilling();
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Failed to cancel');
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const res: any = await restaurantsApi.createRazorpayOrder(activeRestaurantId!);
      const { orderId, amount, currency, keyId, planName } = res.data;

      // Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'RestaurantOS',
        description: `${planName} Plan - Monthly`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await restaurantsApi.confirmPayment(activeRestaurantId!, {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            alert('Payment successful!');
            loadBilling();
          } catch {
            alert('Payment verification failed');
          }
        },
        theme: { color: '#000000' },
      };

      // Load Razorpay if available
      if ((window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        alert('Razorpay SDK not loaded. Add the script to your page.');
      }
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Failed to create order');
    } finally {
      setPaying(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) return <div className="p-6">Loading billing...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Billing & Subscription</h1>

      {/* Current subscription */}
      {subscription ? (
        <div className="mt-6 rounded-lg border p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">Current Plan: {subscription.plan.name}</h2>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[subscription.status] || ''}`}>
                {subscription.status}
              </span>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatPrice(subscription.plan.priceMonthly)}/month
              </p>
              <p className="text-sm text-muted-foreground">
                Period: {formatDate(subscription.currentPeriodStart)} — {formatDate(subscription.currentPeriodEnd)}
              </p>
              {subscription.trialEndsAt && subscription.status === 'TRIALING' && (
                <p className="mt-1 text-sm text-blue-600">
                  Trial ends: {formatDate(subscription.trialEndsAt)}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {subscription.status !== 'CANCELLED' && (
                <>
                  <button
                    onClick={handlePay}
                    disabled={paying}
                    className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                  >
                    {paying ? 'Processing...' : 'Pay Now'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="rounded-md border border-destructive px-4 py-2 text-sm text-destructive"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-md border bg-yellow-50 p-4">
          <p className="text-sm font-medium">No active subscription. Choose a plan below to get started.</p>
        </div>
      )}

      {/* Plans */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Available Plans</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = subscription?.planId === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-lg border p-6 ${isCurrent ? 'border-primary bg-primary/5' : ''}`}
              >
                <h3 className="text-lg font-bold">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                )}
                <p className="mt-3 text-2xl font-bold">
                  {formatPrice(plan.priceMonthly)}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>

                <ul className="mt-4 space-y-1">
                  {plan.maxTables && (
                    <li className="text-sm">Up to {plan.maxTables} tables</li>
                  )}
                  {plan.maxStaff && (
                    <li className="text-sm">Up to {plan.maxStaff} staff</li>
                  )}
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-sm text-muted-foreground">✓ {f}</li>
                  ))}
                </ul>

                <div className="mt-4">
                  {isCurrent ? (
                    <span className="block rounded-md bg-muted py-2 text-center text-sm font-medium">
                      Current Plan
                    </span>
                  ) : subscription ? (
                    <button
                      onClick={() => handleChangePlan(plan.id)}
                      className="w-full rounded-md border px-4 py-2 text-sm hover:bg-accent"
                    >
                      Switch to {plan.name}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
                    >
                      Start Free Trial
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Invoices</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Tax</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{formatDate(inv.createdAt)}</td>
                    <td className="px-4 py-3">{inv.subscription.plan.name}</td>
                    <td className="px-4 py-3 text-right">{formatPrice(inv.amount)}</td>
                    <td className="px-4 py-3 text-right">{formatPrice(inv.tax)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPrice(inv.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
