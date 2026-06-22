import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, ReorderCategoriesDto } from './dto/categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantId: string, includeInactive = false) {
    return this.prisma.category.findMany({
      where: {
        restaurantId,
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { menuItems: { where: { deletedAt: null } } },
        },
      },
    });
  }

  async findById(restaurantId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, restaurantId, deletedAt: null },
      include: {
        menuItems: {
          where: { deletedAt: null, isAvailable: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(restaurantId: string, dto: CreateCategoryDto) {
    const slug = this.generateSlug(dto.name);

    const existing = await this.prisma.category.findUnique({
      where: { restaurantId_slug: { restaurantId, slug } },
    });

    if (existing) {
      throw new ConflictException('A category with this name already exists');
    }

    return this.prisma.category.create({
      data: {
        restaurantId,
        name: dto.name,
        slug,
        description: dto.description,
        image: dto.image,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
  }

  async update(restaurantId: string, categoryId: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, restaurantId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.name) {
      data.slug = this.generateSlug(dto.name);
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data,
    });
  }

  async delete(restaurantId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, restaurantId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data: { deletedAt: new Date() },
    });
  }

  async reorder(restaurantId: string, dto: ReorderCategoriesDto) {
    const updates = dto.categories.map((item) =>
      this.prisma.category.updateMany({
        where: { id: item.id, restaurantId },
        data: { sortOrder: item.sortOrder },
      }),
    );

    await this.prisma.$transaction(updates);
    return this.findAll(restaurantId, true);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
