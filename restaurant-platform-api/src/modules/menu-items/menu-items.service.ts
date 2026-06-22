import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto, UpdateMenuItemDto, UpdateAvailabilityDto } from './dto/menu-items.dto';

@Injectable()
export class MenuItemsService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantId: string, categoryId?: string, search?: string) {
    return this.prisma.menuItem.findMany({
      where: {
        restaurantId,
        deletedAt: null,
        ...(categoryId ? { categoryId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { isAvailable: true }, orderBy: { sortOrder: 'asc' } },
        addOns: { where: { isAvailable: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findPublicMenu(restaurantId: string) {
    const categories = await this.prisma.category.findMany({
      where: { restaurantId, isActive: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          where: { isAvailable: true, deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            variants: { where: { isAvailable: true }, orderBy: { sortOrder: 'asc' } },
            addOns: { where: { isAvailable: true }, orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    return categories;
  }

  async findById(restaurantId: string, itemId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        variants: { orderBy: { sortOrder: 'asc' } },
        addOns: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return item;
  }

  async create(restaurantId: string, dto: CreateMenuItemDto) {
    const { variants, addOns, ...itemData } = dto;

    const item = await this.prisma.menuItem.create({
      data: {
        restaurantId,
        ...itemData,
        ...(variants && variants.length > 0
          ? {
              variants: {
                create: variants.map((v, i) => ({ ...v, sortOrder: i })),
              },
            }
          : {}),
        ...(addOns && addOns.length > 0
          ? {
              addOns: {
                create: addOns.map((a, i) => ({ ...a, sortOrder: i })),
              },
            }
          : {}),
      },
      include: {
        variants: true,
        addOns: true,
      },
    });

    return item;
  }

  async update(restaurantId: string, itemId: string, dto: UpdateMenuItemDto) {
    const existing = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: dto,
      include: {
        variants: true,
        addOns: true,
      },
    });
  }

  async delete(restaurantId: string, itemId: string) {
    const existing = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    });
  }

  async bulkUpdateAvailability(restaurantId: string, dto: UpdateAvailabilityDto) {
    await this.prisma.menuItem.updateMany({
      where: { id: { in: dto.ids }, restaurantId },
      data: { isAvailable: dto.isAvailable },
    });

    return { updated: dto.ids.length };
  }

  // Variant management
  async addVariant(restaurantId: string, itemId: string, data: { name: string; priceAdjustment: number }) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId, deletedAt: null },
    });

    if (!item) throw new NotFoundException('Menu item not found');

    return this.prisma.variant.create({
      data: { menuItemId: itemId, ...data },
    });
  }

  async removeVariant(restaurantId: string, itemId: string, variantId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId, deletedAt: null },
    });

    if (!item) throw new NotFoundException('Menu item not found');

    return this.prisma.variant.delete({ where: { id: variantId } });
  }

  // Add-on management
  async addAddOn(restaurantId: string, itemId: string, data: { name: string; price: number }) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId, deletedAt: null },
    });

    if (!item) throw new NotFoundException('Menu item not found');

    return this.prisma.addOn.create({
      data: { menuItemId: itemId, ...data },
    });
  }

  async removeAddOn(restaurantId: string, itemId: string, addOnId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId, deletedAt: null },
    });

    if (!item) throw new NotFoundException('Menu item not found');

    return this.prisma.addOn.delete({ where: { id: addOnId } });
  }
}
