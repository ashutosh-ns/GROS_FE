import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersCustomerController } from './orders-customer.controller';
import { WebsocketsModule } from '../../websockets/websockets.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [WebsocketsModule, NotificationsModule],
  controllers: [OrdersController, OrdersCustomerController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
