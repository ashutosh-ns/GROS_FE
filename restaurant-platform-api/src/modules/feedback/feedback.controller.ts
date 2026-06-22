import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { FeedbackService } from './feedback.service';
import { SessionGuard } from '../../common/guards';

@ApiTags('Feedback')
@Controller('customer/feedback')
@UseGuards(SessionGuard)
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Post(':orderId')
  @ApiOperation({ summary: 'Submit feedback for an order' })
  async create(
    @Param('orderId') orderId: string,
    @Req() req: Request,
    @Body() body: { rating: number; comment?: string },
  ) {
    const restaurantId = (req as any).restaurantId;
    return this.feedbackService.create(orderId, restaurantId, body);
  }
}
