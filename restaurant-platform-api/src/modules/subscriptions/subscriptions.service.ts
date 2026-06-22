import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getSubscription(restaurantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { restaurantId },
      include: { plan: true },
    });

    return subscription;
  }

  async createSubscription(restaurantId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const existing = await this.prisma.subscription.findUnique({ where: { restaurantId } });
    if (existing) throw new BadRequestException('Restaurant already has a subscription');

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14-day trial
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day period

    return this.prisma.subscription.create({
      data: {
        restaurantId,
        planId,
        status: 'TRIALING',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt: trialEnd,
      },
      include: { plan: true },
    });
  }

  async changePlan(restaurantId: string, newPlanId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { restaurantId } });
    if (!subscription) throw new NotFoundException('No active subscription');

    const plan = await this.prisma.plan.findUnique({ where: { id: newPlanId } });
    if (!plan) throw new NotFoundException('Plan not found');

    return this.prisma.subscription.update({
      where: { restaurantId },
      data: { planId: newPlanId },
      include: { plan: true },
    });
  }

  async cancelSubscription(restaurantId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { restaurantId } });
    if (!subscription) throw new NotFoundException('No active subscription');

    return this.prisma.subscription.update({
      where: { restaurantId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: { plan: true },
    });
  }

  async createRazorpayOrder(restaurantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { restaurantId },
      include: { plan: true },
    });

    if (!subscription) throw new NotFoundException('No subscription found');

    // In production, this would call Razorpay API
    // For now, return mock order data
    const amount = subscription.plan.priceMonthly * 100; // paise

    return {
      orderId: `order_${Date.now()}`,
      amount,
      currency: 'INR',
      planName: subscription.plan.name,
      keyId: this.configService.get<string>('RAZORPAY_KEY_ID') || 'rzp_test_placeholder',
    };
  }

  async handlePaymentSuccess(restaurantId: string, paymentData: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { restaurantId },
      include: { plan: true },
    });

    if (!subscription) throw new NotFoundException('No subscription found');

    // In production: verify signature with Razorpay secret
    // const isValid = verifyRazorpaySignature(...)

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Update subscription
    await this.prisma.subscription.update({
      where: { restaurantId },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // Create invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        restaurantId,
        subscriptionId: subscription.id,
        amount: subscription.plan.priceMonthly,
        tax: subscription.plan.priceMonthly * 0.18, // 18% GST
        total: subscription.plan.priceMonthly * 1.18,
        status: 'paid',
        razorpayPaymentId: paymentData.razorpayPaymentId,
        paidAt: now,
        dueDate: now,
      },
    });

    return { subscription: { ...subscription, status: 'ACTIVE' }, invoice };
  }

  async getInvoices(restaurantId: string) {
    return this.prisma.invoice.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      include: { subscription: { include: { plan: { select: { name: true } } } } },
    });
  }
}
