import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QrService } from './qr.service';
import { JwtAuthGuard, TenantGuard, RolesGuard } from '../../common/guards';
import { CurrentRestaurant, Roles } from '../../common/decorators';

@ApiTags('QR Codes')
@Controller('restaurants/:restaurantId/qr')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class QrController {
  constructor(private qrService: QrService) {}

  @Post('tables/:tableId')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Generate QR code for a specific table' })
  async generateForTable(
    @CurrentRestaurant() restaurantId: string,
    @Param('tableId') tableId: string,
  ) {
    return this.qrService.generateForTable(restaurantId, tableId);
  }

  @Post('generate-all')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Generate QR codes for all active tables' })
  async generateForAll(@CurrentRestaurant() restaurantId: string) {
    return this.qrService.generateForAllTables(restaurantId);
  }
}
