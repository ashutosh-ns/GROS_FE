import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('restaurants/:restaurantId/analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('revenue')
  async getRevenue(
    @Param('restaurantId') restaurantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { fromDate, toDate } = this.parseDates(from, to);
    return this.analyticsService.getRevenue(restaurantId, fromDate, toDate);
  }

  @Get('orders')
  async getOrderAnalytics(
    @Param('restaurantId') restaurantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { fromDate, toDate } = this.parseDates(from, to);
    return this.analyticsService.getOrderAnalytics(restaurantId, fromDate, toDate);
  }

  @Get('products')
  async getProductAnalytics(
    @Param('restaurantId') restaurantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { fromDate, toDate } = this.parseDates(from, to);
    return this.analyticsService.getProductAnalytics(restaurantId, fromDate, toDate);
  }

  @Get('tables')
  async getTableAnalytics(
    @Param('restaurantId') restaurantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { fromDate, toDate } = this.parseDates(from, to);
    return this.analyticsService.getTableAnalytics(restaurantId, fromDate, toDate);
  }

  private parseDates(from?: string, to?: string) {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { fromDate, toDate };
  }
}
