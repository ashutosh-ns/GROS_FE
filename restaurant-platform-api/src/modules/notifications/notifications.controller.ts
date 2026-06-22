import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('restaurants/:restaurantId/notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Param('restaurantId') restaurantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findForRestaurant(
      restaurantId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Param('restaurantId') restaurantId: string) {
    return this.notificationsService.getUnreadCount(restaurantId);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all')
  async markAllAsRead(@Param('restaurantId') restaurantId: string) {
    return this.notificationsService.markAllAsRead(restaurantId);
  }
}
