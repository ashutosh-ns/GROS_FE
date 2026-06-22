import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

interface QrPayload {
  restaurantId: string;
  tableId: string;
  version: number;
}

@Injectable()
export class QrService {
  private readonly qrSecret: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.qrSecret = this.config.get<string>('QR_SECRET') || 'default-qr-secret-change-me';
  }

  generateToken(restaurantId: string, tableId: string): string {
    const payload: QrPayload = { restaurantId, tableId, version: 1 };
    const data = JSON.stringify(payload);
    const encoded = Buffer.from(data).toString('base64url');
    const signature = this.sign(encoded);
    return `${encoded}.${signature}`;
  }

  verifyToken(token: string): QrPayload {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new BadRequestException('Invalid QR token format');
    }

    const [encoded, signature] = parts;
    const expectedSignature = this.sign(encoded!);

    if (!crypto.timingSafeEqual(Buffer.from(signature!), Buffer.from(expectedSignature))) {
      throw new BadRequestException('Invalid QR token signature');
    }

    try {
      const data = Buffer.from(encoded!, 'base64url').toString('utf8');
      const payload = JSON.parse(data) as QrPayload;

      if (!payload.restaurantId || !payload.tableId || !payload.version) {
        throw new Error('Missing fields');
      }

      return payload;
    } catch {
      throw new BadRequestException('Invalid QR token payload');
    }
  }

  async generateForTable(restaurantId: string, tableId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId, deletedAt: null },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const token = this.generateToken(restaurantId, tableId);

    // Deactivate old QR codes for this table
    await this.prisma.qRCode.updateMany({
      where: { tableId, restaurantId, isActive: true },
      data: { isActive: false },
    });

    // Store new QR code
    const qrCode = await this.prisma.qRCode.create({
      data: {
        restaurantId,
        tableId,
        token,
        version: 1,
      },
    });

    return {
      id: qrCode.id,
      token,
      url: `${this.config.get('FRONTEND_URL')}/scan?token=${token}`,
      tableId,
      tableNumber: table.number,
      tableName: table.name,
    };
  }

  async generateForAllTables(restaurantId: string) {
    const tables = await this.prisma.table.findMany({
      where: { restaurantId, isActive: true, deletedAt: null },
      orderBy: { number: 'asc' },
    });

    const results = await Promise.all(
      tables.map((table) => this.generateForTable(restaurantId, table.id)),
    );

    return results;
  }

  private sign(data: string): string {
    return crypto.createHmac('sha256', this.qrSecret).update(data).digest('base64url');
  }
}
