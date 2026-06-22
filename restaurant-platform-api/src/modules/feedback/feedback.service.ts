import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async create(orderId: string, restaurantId: string, data: { rating: number; comment?: string }) {
    // Verify order belongs to restaurant
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    // Check if feedback already exists
    const existing = await this.prisma.feedback.findUnique({
      where: { orderId },
    });

    if (existing) {
      throw new ConflictException('Feedback already submitted for this order');
    }

    return this.prisma.feedback.create({
      data: {
        restaurantId,
        orderId,
        rating: data.rating,
        comment: data.comment,
      },
    });
  }

  async findByRestaurant(restaurantId: string, page = 1, limit = 20) {
    const [feedback, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where: { restaurantId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
            select: { orderNumber: true, total: true, table: { select: { number: true } } },
          },
        },
      }),
      this.prisma.feedback.count({ where: { restaurantId } }),
    ]);

    return { data: feedback, meta: { page, limit, total } };
  }
}
