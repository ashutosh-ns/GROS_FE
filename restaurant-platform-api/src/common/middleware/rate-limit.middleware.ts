import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../modules/redis/redis.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private redis: RedisService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const sessionToken = req.headers['x-session-token'] as string;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (sessionToken) {
      // Session-based rate limit: 20 req/min
      const sessionKey = `ratelimit:session:${sessionToken}`;
      const sessionCount = await this.redis.incr(sessionKey);

      if (sessionCount === 1) {
        await this.redis.expire(sessionKey, 60);
      }

      if (sessionCount > 20) {
        throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    // IP-based rate limit: 100 req/hour
    const ipKey = `ratelimit:ip:${ip}`;
    const ipCount = await this.redis.incr(ipKey);

    if (ipCount === 1) {
      await this.redis.expire(ipKey, 3600);
    }

    if (ipCount > 100) {
      throw new HttpException('Too many requests from this IP', HttpStatus.TOO_MANY_REQUESTS);
    }

    next();
  }
}
