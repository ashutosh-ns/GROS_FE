import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Super admins can access any restaurant
    if (user.platformRole === 'SUPER_ADMIN' || user.platformRole === 'PLATFORM_ADMIN') {
      const restaurantId = request.params.restaurantId || request.headers['x-restaurant-id'];
      if (restaurantId) {
        request.restaurantId = restaurantId;
      }
      return true;
    }

    // Get restaurant from header or params
    const restaurantId = request.params.restaurantId || request.headers['x-restaurant-id'];

    if (!restaurantId) {
      throw new ForbiddenException('Restaurant context required');
    }

    // Verify user is a member of this restaurant
    const membership = await this.prisma.restaurantMember.findUnique({
      where: {
        userId_restaurantId: {
          userId: user.id,
          restaurantId,
        },
      },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('You do not have access to this restaurant');
    }

    request.restaurantId = restaurantId;
    request.restaurantRole = membership.role;
    // Attach role to user object for RolesGuard
    user.restaurantRole = membership.role;

    return true;
  }
}
