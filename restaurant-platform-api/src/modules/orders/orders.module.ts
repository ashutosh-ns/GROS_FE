import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersCustomerController } from './orders-customer.controller';

@Module({
  controllers: [OrdersController, OrdersCustomerController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
