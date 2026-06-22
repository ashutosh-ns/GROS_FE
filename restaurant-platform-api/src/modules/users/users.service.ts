import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        platformRole: true,
        emailVerified: true,
        createdAt: true,
        memberships: {
          where: { isActive: true },
          select: {
            restaurantId: true,
            role: true,
            restaurant: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async getMyRestaurants(userId: string) {
    const memberships = await this.prisma.restaurantMember.findMany({
      where: { userId, isActive: true },
      select: {
        role: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            isActive: true,
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.restaurant,
      role: m.role,
    }));
  }
}
