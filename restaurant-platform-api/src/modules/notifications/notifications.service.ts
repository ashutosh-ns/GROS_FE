import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../../websockets/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(data: {
    userId?: string;
    restaurantId?: string;
    title: string;
    body: string;
    type: string;
    data?: Record<string, unknown>;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        restaurantId: data.restaurantId,
        title: data.title,
        body: data.body,
        type: data.type,
        data: data.data || undefined,
      },
    });

    // Push via WebSocket if restaurant-scoped
    if (data.restaurantId) {
      this.eventsGateway.server
        .to(`restaurant:${data.restaurantId}`)
        .emit('notification:new', notification);
    }

    return notification;
  }

  async findForRestaurant(restaurantId: string, page = 1, limit = 20) {
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { restaurantId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where: { restaurantId } }),
    ]);

    const unreadCount = await this.prisma.notification.count({
      where: { restaurantId, isRead: false },
    });

    return {
      data: notifications,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), unreadCount },
    };
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(restaurantId: string) {
    await this.prisma.notification.updateMany({
      where: { restaurantId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  async getUnreadCount(restaurantId: string) {
    const count = await this.prisma.notification.count({
      where: { restaurantId, isRead: false },
    });
    return { count };
  }
}
