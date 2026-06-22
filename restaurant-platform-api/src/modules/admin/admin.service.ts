import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getPlatformStats() {
    const [
      totalRestaurants,
      activeRestaurants,
      totalUsers,
      totalOrders,
      revenueResult,
    ] = await Promise.all([
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { notIn: ['CANCELLED'] } },
      }),
    ]);

    // Orders this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [ordersThisMonth, revenueThisMonth] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { notIn: ['CANCELLED'] }, createdAt: { gte: monthStart } },
      }),
    ]);

    return {
      totalRestaurants,
      activeRestaurants,
      totalUsers,
      totalOrders,
      totalRevenue: revenueResult._sum.total || 0,
      ordersThisMonth,
      revenueThisMonth: revenueThisMonth._sum.total || 0,
    };
  }

  async listRestaurants(filters: {
    search?: string;
    isActive?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, isActive, page = 1, limit = 20 } = filters;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { orders: true, members: true, tables: true } },
          subscription: { include: { plan: { select: { name: true } } } },
        },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return {
      data: restaurants,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getRestaurantDetail(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        subscription: { include: { plan: true } },
        _count: { select: { orders: true, tables: true, menuItems: true, categories: true } },
      },
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');

    // Get revenue for this restaurant
    const revenue = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: { restaurantId, status: { notIn: ['CANCELLED'] } },
    });

    return { ...restaurant, totalRevenue: revenue._sum.total || 0 };
  }

  async toggleRestaurantActive(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { isActive: true },
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isActive: !restaurant.isActive },
    });
  }

  async impersonate(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        members: {
          where: { role: 'OWNER' },
          include: { user: { select: { id: true, email: true } } },
          take: 1,
        },
      },
    });

    if (!restaurant || restaurant.members.length === 0) {
      throw new NotFoundException('Restaurant or owner not found');
    }

    const owner = restaurant.members[0].user;

    const token = this.jwtService.sign(
      { sub: owner.id, email: owner.email, type: 'access' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      },
    );

    return { token, restaurantId, restaurantName: restaurant.name };
  }

  async listUsers(filters: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 20 } = filters;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          platformRole: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { memberships: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async toggleUserActive(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });

    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }

  async getAuditLogs(filters: {
    entity?: string;
    action?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const { entity, action, userId, page = 1, limit = 50 } = filters;

    const where: Record<string, unknown> = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { email: true, firstName: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
