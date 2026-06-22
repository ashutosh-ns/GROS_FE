import { Body, Controller, Get, Param, Patch, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusSchema, UpdateOrderStatusDto } from './dto/orders.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, TenantGuard, RolesGuard } from '../../common/guards';
import { CurrentRestaurant, Roles } from '../../common/decorators';

@ApiTags('Orders (Staff)')
@Controller('restaurants/:restaurantId/orders')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders (filterable)' })
  async findAll(
    @CurrentRestaurant() restaurantId: string,
    @Query('status') status?: string,
    @Query('tableId') tableId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAllForRestaurant(restaurantId, {
      status,
      tableId,
      from,
      to,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get order details' })
  async findOne(@CurrentRestaurant() restaurantId: string, @Param('orderId') orderId: string) {
    return this.ordersService.findById(orderId, restaurantId);
  }

  @Patch(':orderId/status')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER', 'WAITER', 'CASHIER', 'KITCHEN')
  @ApiOperation({ summary: 'Update order status' })
  @UsePipes(new ZodValidationPipe(UpdateOrderStatusSchema))
  async updateStatus(
    @CurrentRestaurant() restaurantId: string,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(restaurantId, orderId, dto);
  }
}
