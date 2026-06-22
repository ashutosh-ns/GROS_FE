import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { MenuItemsService } from './menu-items.service';
import { SessionGuard } from '../../common/guards';

@ApiTags('Menu (Customer)')
@Controller('menu')
@UseGuards(SessionGuard)
export class MenuPublicController {
  constructor(private menuItemsService: MenuItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Get full menu for customer (session required)' })
  async getMenu(@Req() req: Request) {
    const restaurantId = (req as any).restaurantId;
    return this.menuItemsService.findPublicMenu(restaurantId);
  }
}
