import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { Public } from '../../common/decorators';

@Controller()
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @Public()
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('restaurants/:restaurantId/subscription')
  async getSubscription(@Param('restaurantId') restaurantId: string) {
    return this.subscriptionsService.getSubscription(restaurantId);
  }

  @Post('restaurants/:restaurantId/subscription')
  async createSubscription(
    @Param('restaurantId') restaurantId: string,
    @Body() body: { planId: string },
  ) {
    return this.subscriptionsService.createSubscription(restaurantId, body.planId);
  }

  @Patch('restaurants/:restaurantId/subscription/change-plan')
  async changePlan(
    @Param('restaurantId') restaurantId: string,
    @Body() body: { planId: string },
  ) {
    return this.subscriptionsService.changePlan(restaurantId, body.planId);
  }

  @Patch('restaurants/:restaurantId/subscription/cancel')
  async cancelSubscription(@Param('restaurantId') restaurantId: string) {
    return this.subscriptionsService.cancelSubscription(restaurantId);
  }

  @Post('restaurants/:restaurantId/subscription/create-order')
  async createRazorpayOrder(@Param('restaurantId') restaurantId: string) {
    return this.subscriptionsService.createRazorpayOrder(restaurantId);
  }

  @Post('restaurants/:restaurantId/subscription/payment-success')
  async handlePaymentSuccess(
    @Param('restaurantId') restaurantId: string,
    @Body() body: { razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string },
  ) {
    return this.subscriptionsService.handlePaymentSuccess(restaurantId, body);
  }

  @Get('restaurants/:restaurantId/invoices')
  async getInvoices(@Param('restaurantId') restaurantId: string) {
    return this.subscriptionsService.getInvoices(restaurantId);
  }
}
