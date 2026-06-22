import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../../modules/redis/redis.service';

export interface SessionData {
  sessionId: string;
  restaurantId: string;
  tableId: string;
  deviceFingerprint: string;
  expiresAt: string;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionToken = request.headers['x-session-token'];

    if (!sessionToken) {
      throw new UnauthorizedException('Session token required');
    }

    const sessionData = await this.redis.get(`session:${sessionToken}`);

    if (!sessionData) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const session: SessionData = JSON.parse(sessionData);

    const now = new Date();
    if (new Date(session.expiresAt) < now) {
      await this.redis.del(`session:${sessionToken}`);
      throw new UnauthorizedException('Session expired');
    }

    request.session = session;
    request.restaurantId = session.restaurantId;
    request.tableId = session.tableId;

    return true;
  }
}
