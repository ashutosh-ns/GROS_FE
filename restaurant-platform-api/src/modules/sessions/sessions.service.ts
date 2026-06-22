import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QrService } from '../qr/qr.service';

interface SessionData {
  sessionId: string;
  restaurantId: string;
  tableId: string;
  deviceFingerprint: string;
  expiresAt: string;
}

@Injectable()
export class SessionsService {
  private readonly sessionExpiryHours: number;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private qrService: QrService,
    private config: ConfigService,
  ) {
    this.sessionExpiryHours = this.config.get<number>('SESSION_EXPIRY_HOURS') || 2;
  }

  async createFromQrScan(token: string, deviceFingerprint?: string) {
    const payload = this.qrService.verifyToken(token);

    // Verify restaurant exists and is active
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: payload.restaurantId, isActive: true, deletedAt: null },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found or inactive');
    }

    // Verify table exists and is active
    const table = await this.prisma.table.findFirst({
      where: { id: payload.tableId, restaurantId: payload.restaurantId, isActive: true, deletedAt: null },
    });

    if (!table) {
      throw new NotFoundException('Table not found or inactive');
    }

    // Update QR code last scanned
    await this.prisma.qRCode.updateMany({
      where: { restaurantId: payload.restaurantId, tableId: payload.tableId, isActive: true },
      data: { lastScannedAt: new Date() },
    });

    // Create session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + this.sessionExpiryHours * 60 * 60 * 1000);

    const sessionData: SessionData = {
      sessionId,
      restaurantId: payload.restaurantId,
      tableId: payload.tableId,
      deviceFingerprint: deviceFingerprint || 'unknown',
      expiresAt: expiresAt.toISOString(),
    };

    // Store in Redis with TTL
    const ttlSeconds = this.sessionExpiryHours * 60 * 60;
    await this.redis.set(`session:${sessionId}`, JSON.stringify(sessionData), ttlSeconds);

    // Also store in DB for reference
    await this.prisma.session.create({
      data: {
        id: sessionId,
        restaurantId: payload.restaurantId,
        tableId: payload.tableId,
        deviceFingerprint: deviceFingerprint || 'unknown',
        expiresAt,
      },
    });

    return {
      sessionToken: sessionId,
      expiresIn: ttlSeconds,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        logo: restaurant.logo,
      },
      table: {
        id: table.id,
        number: table.number,
        name: table.name,
      },
    };
  }

  async getSession(sessionToken: string): Promise<SessionData | null> {
    const data = await this.redis.get(`session:${sessionToken}`);
    if (!data) return null;
    return JSON.parse(data);
  }

  async endSession(sessionToken: string) {
    await this.redis.del(`session:${sessionToken}`);
    await this.prisma.session.updateMany({
      where: { id: sessionToken },
      data: { isActive: false },
    });
  }
}
