import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, AllRoles } from '../decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AllRoles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // Check platform role
    if (user.platformRole && requiredRoles.includes(user.platformRole)) {
      return true;
    }

    // Check restaurant role
    if (user.restaurantRole && requiredRoles.includes(user.restaurantRole)) {
      return true;
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}
