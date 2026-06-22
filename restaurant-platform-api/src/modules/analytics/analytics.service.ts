import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getRevenue(restaurantId: string, from: Date, to: Date) {
    const cacheKey = `analytics:revenue:${restaurantId}:${from.toISOString()}:${to.toISOString()}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: { notIn: ['CANCELLED'] },
        createdAt: { gte: from, lte: to },
      },
      select: { total: true, subtotal: true, tax: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyRevenue: Record<string, { date: string; revenue: number; orders: number }> = {};

    for (const order of orders) {
      const day = order.createdAt.toISOString().split('T')[0];
      if (!dailyRevenue[day]) {
        dailyRevenue[day] = { date: day, revenue: 0, orders: 0 };
      }
      dailyRevenue[day].revenue += order.total;
      dailyRevenue[day].orders += 1;
    }

    const result = {
      labels: Object.keys(dailyRevenue),
      datasets: Object.values(dailyRevenue),
      summary: {
        totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
        totalOrders: orders.length,
        avgOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0,
        totalTax: orders.reduce((sum, o) => sum + o.tax, 0),
      },
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  async getOrderAnalytics(restaurantId: string, from: Date, to: Date) {
    const cacheKey = `analytics:orders:${restaurantId}:${from.toISOString()}:${to.toISOString()}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: from, lte: to },
      },
      select: { status: true, total: true, createdAt: true },
    });

    const byStatus: Record<string, number> = {};
    const byHour: Record<number, number> = {};

    for (const order of orders) {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
      const hour = order.createdAt.getHours();
      byHour[hour] = (byHour[hour] || 0) + 1;
    }

    const peakHours = Object.entries(byHour)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);

    const result = {
      byStatus,
      peakHours,
      totalOrders: orders.length,
      completedOrders: orders.filter((o) => o.status === 'COMPLETED').length,
      cancelledOrders: orders.filter((o) => o.status === 'CANCELLED').length,
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  async getProductAnalytics(restaurantId: string, from: Date, to: Date) {
    const cacheKey = `analytics:products:${restaurantId}:${from.toISOString()}:${to.toISOString()}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          status: { notIn: ['CANCELLED'] },
          createdAt: { gte: from, lte: to },
        },
      },
      select: {
        menuItemId: true,
        quantity: true,
        totalPrice: true,
        menuItem: { select: { name: true, categoryId: true } },
      },
    });

    const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const item of orderItems) {
      if (!productMap[item.menuItemId]) {
        productMap[item.menuItemId] = { name: item.menuItem.name, quantity: 0, revenue: 0 };
      }
      productMap[item.menuItemId].quantity += item.quantity;
      productMap[item.menuItemId].revenue += item.totalPrice;
    }

    const products = Object.values(productMap).sort((a, b) => b.quantity - a.quantity);

    const result = {
      bestSellers: products.slice(0, 10),
      worstPerformers: products.slice(-5).reverse(),
      totalItemsSold: orderItems.reduce((sum, i) => sum + i.quantity, 0),
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  async getTableAnalytics(restaurantId: string, from: Date, to: Date) {
    const cacheKey = `analytics:tables:${restaurantId}:${from.toISOString()}:${to.toISOString()}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: { notIn: ['CANCELLED'] },
        createdAt: { gte: from, lte: to },
      },
      select: {
        tableId: true,
        total: true,
        table: { select: { number: true, name: true } },
      },
    });

    const tableMap: Record<string, { tableNumber: number; name: string | null; orders: number; revenue: number }> = {};

    for (const order of orders) {
      if (!tableMap[order.tableId]) {
        tableMap[order.tableId] = {
          tableNumber: order.table.number,
          name: order.table.name,
          orders: 0,
          revenue: 0,
        };
      }
      tableMap[order.tableId].orders += 1;
      tableMap[order.tableId].revenue += order.total;
    }

    const tables = Object.values(tableMap).sort((a, b) => b.revenue - a.revenue);

    const result = { tables };

    await this.redis.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }
}
