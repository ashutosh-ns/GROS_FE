import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantDto, UpdateRestaurantDto, InviteMemberDto } from './dto/restaurants.dto';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRestaurantDto, ownerId: string) {
    const slug = this.generateSlug(dto.name);

    const existingSlug = await this.prisma.restaurant.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException('A restaurant with a similar name already exists');
    }

    const restaurant = await this.prisma.restaurant.create({
      data: {
        ...dto,
        slug,
        members: {
          create: {
            userId: ownerId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
          },
        },
      },
    });

    return restaurant;
  }

  async findById(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id, deletedAt: null },
      include: {
        members: {
          where: { isActive: true },
          select: {
            id: true,
            userId: true,
            role: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            tables: true,
            categories: true,
            menuItems: true,
            orders: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async update(id: string, dto: UpdateRestaurantDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id, deletedAt: null },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return this.prisma.restaurant.update({
      where: { id },
      data: dto,
    });
  }

  async inviteMember(restaurantId: string, dto: InviteMemberDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User with this email not found. They must register first.');
    }

    const existingMembership = await this.prisma.restaurantMember.findUnique({
      where: {
        userId_restaurantId: {
          userId: user.id,
          restaurantId,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        throw new ConflictException('User is already a member of this restaurant');
      }
      // Reactivate membership with new role
      return this.prisma.restaurantMember.update({
        where: { id: existingMembership.id },
        data: { isActive: true, role: dto.role },
      });
    }

    return this.prisma.restaurantMember.create({
      data: {
        userId: user.id,
        restaurantId,
        role: dto.role,
      },
    });
  }

  async removeMember(restaurantId: string, memberId: string, requestingUserId: string) {
    const member = await this.prisma.restaurantMember.findFirst({
      where: { id: memberId, restaurantId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove the restaurant owner');
    }

    if (member.userId === requestingUserId) {
      throw new ForbiddenException('Cannot remove yourself');
    }

    return this.prisma.restaurantMember.update({
      where: { id: memberId },
      data: { isActive: false },
    });
  }

  async updateMemberRole(
    restaurantId: string,
    memberId: string,
    role: 'MANAGER' | 'WAITER' | 'CASHIER' | 'KITCHEN' | 'STAFF',
  ) {
    const member = await this.prisma.restaurantMember.findFirst({
      where: { id: memberId, restaurantId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenException('Cannot change owner role');
    }

    return this.prisma.restaurantMember.update({
      where: { id: memberId },
      data: { role },
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
}
