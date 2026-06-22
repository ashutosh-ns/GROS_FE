import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto, UpdateTableDto } from './dto/tables.dto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantId: string) {
    return this.prisma.table.findMany({
      where: { restaurantId, deletedAt: null },
      orderBy: { number: 'asc' },
      include: {
        _count: {
          select: { sessions: { where: { isActive: true } } },
        },
      },
    });
  }

  async create(restaurantId: string, dto: CreateTableDto) {
    const existing = await this.prisma.table.findUnique({
      where: { restaurantId_number: { restaurantId, number: dto.number } },
    });

    if (existing) {
      throw new ConflictException(`Table ${dto.number} already exists`);
    }

    return this.prisma.table.create({
      data: {
        restaurantId,
        number: dto.number,
        name: dto.name || `Table ${dto.number}`,
        capacity: dto.capacity,
      },
    });
  }

  async update(restaurantId: string, tableId: string, dto: UpdateTableDto) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId, deletedAt: null },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return this.prisma.table.update({
      where: { id: tableId },
      data: dto,
    });
  }

  async delete(restaurantId: string, tableId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId, deletedAt: null },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return this.prisma.table.update({
      where: { id: tableId },
      data: { deletedAt: new Date() },
    });
  }
}
