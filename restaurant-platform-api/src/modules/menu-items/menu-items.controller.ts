import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenuItemsService } from './menu-items.service';
import {
  CreateMenuItemSchema,
  UpdateMenuItemSchema,
  UpdateAvailabilitySchema,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  UpdateAvailabilityDto,
} from './dto/menu-items.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, TenantGuard, RolesGuard } from '../../common/guards';
import { CurrentRestaurant, Roles } from '../../common/decorators';

@ApiTags('Menu Items')
@Controller('restaurants/:restaurantId/menu-items')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class MenuItemsController {
  constructor(private menuItemsService: MenuItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all menu items (staff view)' })
  async findAll(
    @CurrentRestaurant() restaurantId: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.menuItemsService.findAll(restaurantId, categoryId, search);
  }

  @Get(':itemId')
  @ApiOperation({ summary: 'Get menu item details' })
  async findOne(@CurrentRestaurant() restaurantId: string, @Param('itemId') itemId: string) {
    return this.menuItemsService.findById(restaurantId, itemId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create a menu item' })
  @UsePipes(new ZodValidationPipe(CreateMenuItemSchema))
  async create(@CurrentRestaurant() restaurantId: string, @Body() dto: CreateMenuItemDto) {
    return this.menuItemsService.create(restaurantId, dto);
  }

  @Patch(':itemId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update a menu item' })
  @UsePipes(new ZodValidationPipe(UpdateMenuItemSchema))
  async update(
    @CurrentRestaurant() restaurantId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuItemsService.update(restaurantId, itemId, dto);
  }

  @Delete(':itemId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Delete a menu item (soft delete)' })
  async delete(@CurrentRestaurant() restaurantId: string, @Param('itemId') itemId: string) {
    return this.menuItemsService.delete(restaurantId, itemId);
  }

  @Patch('bulk/availability')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER', 'KITCHEN')
  @ApiOperation({ summary: 'Bulk update item availability' })
  @UsePipes(new ZodValidationPipe(UpdateAvailabilitySchema))
  async bulkAvailability(
    @CurrentRestaurant() restaurantId: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.menuItemsService.bulkUpdateAvailability(restaurantId, dto);
  }

  @Post(':itemId/variants')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Add a variant to menu item' })
  async addVariant(
    @CurrentRestaurant() restaurantId: string,
    @Param('itemId') itemId: string,
    @Body() body: { name: string; priceAdjustment: number },
  ) {
    return this.menuItemsService.addVariant(restaurantId, itemId, body);
  }

  @Delete(':itemId/variants/:variantId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Remove a variant' })
  async removeVariant(
    @CurrentRestaurant() restaurantId: string,
    @Param('itemId') itemId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.menuItemsService.removeVariant(restaurantId, itemId, variantId);
  }

  @Post(':itemId/add-ons')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Add an add-on to menu item' })
  async addAddOn(
    @CurrentRestaurant() restaurantId: string,
    @Param('itemId') itemId: string,
    @Body() body: { name: string; price: number },
  ) {
    return this.menuItemsService.addAddOn(restaurantId, itemId, body);
  }

  @Delete(':itemId/add-ons/:addOnId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Remove an add-on' })
  async removeAddOn(
    @CurrentRestaurant() restaurantId: string,
    @Param('itemId') itemId: string,
    @Param('addOnId') addOnId: string,
  ) {
    return this.menuItemsService.removeAddOn(restaurantId, itemId, addOnId);
  }
}
