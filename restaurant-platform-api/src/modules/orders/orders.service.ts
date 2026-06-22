import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../../websockets/events.gateway';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private eventsGateway: EventsGateway,
  ) {}

  async createFromSession(sessionToken: string, dto: CreateOrderDto) {
    // Get session data from Redis
    const sessionData = await this.redis.get(`session:${sessionToken}`);
    if (!sessionData) {
      throw new BadRequestException('Invalid or expired session');
    }

    const session = JSON.parse(sessionData);
    const { restaurantId, tableId } = session;

    // Validate all items exist and belong to this restaurant
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId, isAvailable: true, deletedAt: null },
      include: { variants: true, addOns: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('Some menu items are not available');
    }

    // Calculate pricing
    let subtotal = 0;
    const orderItems: Array<{
      menuItemId: string;
      variantId: string | null;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      notes: string | null;
      addOnIds: string[];
    }> = [];

    for (const item of dto.items) {
      const menuItem = menuItems.find((m) => m.id === item.menuItemId);
      if (!menuItem) continue;

      let unitPrice = menuItem.discountPrice || menuItem.price;

      // Add variant price adjustment
      if (item.variantId) {
        const variant = menuItem.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new BadRequestException(`Invalid variant for item ${menuItem.name}`);
        }
        unitPrice += variant.priceAdjustment;
      }

      // Add add-on prices
      let addOnTotal = 0;
      if (item.addOnIds && item.addOnIds.length > 0) {
        for (const addOnId of item.addOnIds) {
          const addOn = menuItem.addOns.find((a) => a.id === addOnId);
          if (!addOn) {
            throw new BadRequestException(`Invalid add-on for item ${menuItem.name}`);
          }
          addOnTotal += addOn.price;
        }
      }

      const totalPrice = (unitPrice + addOnTotal) * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        menuItemId: item.menuItemId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPrice: unitPrice + addOnTotal,
        totalPrice,
        notes: item.notes || null,
        addOnIds: item.addOnIds || [],
      });
    }

    // Get restaurant tax rate
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { taxRate: true },
    });

    const taxRate = restaurant?.taxRate || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    // Generate order number (sequential per restaurant per day)
    const orderNumber = await this.getNextOrderNumber(restaurantId);

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        restaurantId,
        tableId,
        sessionId: sessionToken,
        orderNumber,
        subtotal,
        tax,
        total,
        discount: 0,
        notes: dto.notes,
        items: {
          create: orderItems.map((item) => ({
            menuItemId: item.menuItemId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes,
            ...(item.addOnIds.length > 0
              ? {
                  addOns: {
                    create: item.addOnIds.map((addOnId) => {
                      const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
                      const addOn = menuItem.addOns.find((a) => a.id === addOnId)!;
                      return { addOnId, price: addOn.price };
                    }),
                  },
                }
              : {}),
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: { select: { name: true, image: true } },
            variant: { select: { name: true } },
            addOns: { include: { addOn: { select: { name: true } } } },
          },
        },
        table: { select: { number: true, name: true } },
      },
    });

    this.eventsGateway.emitNewOrder(restaurantId, order);

    return order;
  }

  async findBySession(sessionToken: string) {
    const sessionData = await this.redis.get(`session:${sessionToken}`);
    if (!sessionData) return [];

    const session = JSON.parse(sessionData);

    return this.prisma.order.findMany({
      where: { sessionId: sessionToken, restaurantId: session.restaurantId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            menuItem: { select: { name: true, image: true } },
            variant: { select: { name: true } },
            addOns: { include: { addOn: { select: { name: true } } } },
          },
        },
      },
    });
  }

  async findById(orderId: string, restaurantId?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, ...(restaurantId ? { restaurantId } : {}) },
      include: {
        items: {
          include: {
            menuItem: { select: { name: true, image: true, vegType: true } },
            variant: { select: { name: true } },
            addOns: { include: { addOn: { select: { name: true } } } },
          },
        },
        table: { select: { number: true, name: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findAllForRestaurant(
    restaurantId: string,
    filters: { status?: string; tableId?: string; from?: string; to?: string; page?: number; limit?: number },
  ) {
    const { status, tableId, from, to, page = 1, limit = 20 } = filters;

    const where: Record<string, unknown> = { restaurantId };
    if (status) where.status = status;
    if (tableId) where.tableId = tableId;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: {
            include: {
              menuItem: { select: { name: true, vegType: true } },
              variant: { select: { name: true } },
              addOns: { include: { addOn: { select: { name: true } } } },
            },
          },
          table: { select: { number: true, name: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateStatus(restaurantId: string, orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    this.validateStatusTransition(order.status, dto.status);

    const timestamps: Record<string, Date> = {};
    switch (dto.status) {
      case 'ACCEPTED':
        timestamps.acceptedAt = new Date();
        break;
      case 'PREPARING':
        timestamps.preparingAt = new Date();
        break;
      case 'READY':
        timestamps.readyAt = new Date();
        break;
      case 'SERVED':
        timestamps.servedAt = new Date();
        break;
      case 'COMPLETED':
        timestamps.completedAt = new Date();
        break;
      case 'CANCELLED':
        timestamps.cancelledAt = new Date();
        break;
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        ...(dto.cancelReason ? { cancelReason: dto.cancelReason } : {}),
        ...timestamps,
      },
      include: {
        items: {
          include: {
            menuItem: { select: { name: true } },
            variant: { select: { name: true } },
          },
        },
        table: { select: { number: true, name: true } },
      },
    });

    this.eventsGateway.emitOrderStatusUpdate(restaurantId, updatedOrder);

    return updatedOrder;
  }

  async requestBill(sessionToken: string) {
    const sessionData = await this.redis.get(`session:${sessionToken}`);
    if (!sessionData) {
      throw new BadRequestException('Invalid or expired session');
    }

    const session = JSON.parse(sessionData);

    const orders = await this.prisma.order.findMany({
      where: {
        sessionId: sessionToken,
        restaurantId: session.restaurantId,
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        items: {
          include: {
            menuItem: { select: { name: true } },
            variant: { select: { name: true } },
            addOns: { include: { addOn: { select: { name: true } } } },
          },
        },
      },
    });

    const totalAmount = orders.reduce((sum, o) => sum + o.total, 0);

    // Notify staff about bill request
    const table = await this.prisma.table.findUnique({
      where: { id: session.tableId },
      select: { number: true },
    });
    this.eventsGateway.emitBillRequest(session.restaurantId, {
      tableId: session.tableId,
      tableNumber: table?.number || 0,
      sessionId: sessionToken,
    });

    return {
      orders,
      summary: {
        totalOrders: orders.length,
        subtotal: orders.reduce((sum, o) => sum + o.subtotal, 0),
        tax: orders.reduce((sum, o) => sum + o.tax, 0),
        discount: orders.reduce((sum, o) => sum + o.discount, 0),
        total: totalAmount,
      },
      table: {
        id: session.tableId,
      },
    };
  }

  private validateStatusTransition(current: string, next: string) {
    const allowed: Record<string, string[]> = {
      PLACED: ['ACCEPTED', 'CANCELLED'],
      ACCEPTED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY'],
      READY: ['SERVED'],
      SERVED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${next}`,
      );
    }
  }

  private async getNextOrderNumber(restaurantId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastOrder = await this.prisma.order.findFirst({
      where: {
        restaurantId,
        createdAt: { gte: today },
      },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    return (lastOrder?.orderNumber || 0) + 1;
  }
}
