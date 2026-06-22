import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  ReorderCategoriesSchema,
  CreateCategoryDto,
  UpdateCategoryDto,
  ReorderCategoriesDto,
} from './dto/categories.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, TenantGuard, RolesGuard } from '../../common/guards';
import { CurrentRestaurant, Roles } from '../../common/decorators';

@ApiTags('Categories')
@Controller('restaurants/:restaurantId/categories')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  async findAll(@CurrentRestaurant() restaurantId: string) {
    return this.categoriesService.findAll(restaurantId, true);
  }

  @Get(':categoryId')
  @ApiOperation({ summary: 'Get category with menu items' })
  async findOne(
    @CurrentRestaurant() restaurantId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.categoriesService.findById(restaurantId, categoryId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create a category' })
  @UsePipes(new ZodValidationPipe(CreateCategorySchema))
  async create(@CurrentRestaurant() restaurantId: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(restaurantId, dto);
  }

  @Patch(':categoryId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update a category' })
  @UsePipes(new ZodValidationPipe(UpdateCategorySchema))
  async update(
    @CurrentRestaurant() restaurantId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(restaurantId, categoryId, dto);
  }

  @Delete(':categoryId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Delete a category (soft delete)' })
  async delete(
    @CurrentRestaurant() restaurantId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.categoriesService.delete(restaurantId, categoryId);
  }

  @Patch('reorder')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Reorder categories' })
  @UsePipes(new ZodValidationPipe(ReorderCategoriesSchema))
  async reorder(@CurrentRestaurant() restaurantId: string, @Body() dto: ReorderCategoriesDto) {
    return this.categoriesService.reorder(restaurantId, dto);
  }
}
