import { Body, Controller, Get, Headers, Param, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderSchema, CreateOrderDto } from './dto/orders.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SessionGuard } from '../../common/guards';

@ApiTags('Orders (Customer)')
@Controller('customer/orders')
@UseGuards(SessionGuard)
export class OrdersCustomerController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Place a new order (customer session)' })
  @UsePipes(new ZodValidationPipe(CreateOrderSchema))
  async create(
    @Headers('x-session-token') sessionToken: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createFromSession(sessionToken, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for current session' })
  async findMyOrders(@Headers('x-session-token') sessionToken: string) {
    return this.ordersService.findBySession(sessionToken);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get specific order details' })
  async findOne(
    @Headers('x-session-token') _sessionToken: string,
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.findById(orderId);
  }

  @Post('bill')
  @ApiOperation({ summary: 'Request bill for current session' })
  async requestBill(@Headers('x-session-token') sessionToken: string) {
    return this.ordersService.requestBill(sessionToken);
  }
}
