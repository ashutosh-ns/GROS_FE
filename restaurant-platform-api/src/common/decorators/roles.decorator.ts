import { SetMetadata } from '@nestjs/common';
import { PlatformRole, RestaurantRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

export type AllRoles = PlatformRole | RestaurantRole;

export const Roles = (...roles: AllRoles[]) => SetMetadata(ROLES_KEY, roles);
