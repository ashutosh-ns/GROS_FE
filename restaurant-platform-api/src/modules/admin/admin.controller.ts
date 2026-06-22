import { Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('restaurants')
  async listRestaurants(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listRestaurants({
      search,
      isActive,
      page: parseInt(page || '1'),
      limit: parseInt(limit || '20'),
    });
  }

  @Get('restaurants/:id')
  async getRestaurantDetail(@Param('id') id: string) {
    return this.adminService.getRestaurantDetail(id);
  }

  @Patch('restaurants/:id/toggle-active')
  async toggleRestaurantActive(@Param('id') id: string) {
    return this.adminService.toggleRestaurantActive(id);
  }

  @Post('restaurants/:id/impersonate')
  async impersonate(@Param('id') id: string) {
    return this.adminService.impersonate(id);
  }

  @Get('users')
  async listUsers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listUsers({
      search,
      page: parseInt(page || '1'),
      limit: parseInt(limit || '20'),
    });
  }

  @Patch('users/:id/toggle-active')
  async toggleUserActive(@Param('id') id: string) {
    return this.adminService.toggleUserActive(id);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLogs({
      entity,
      action,
      userId,
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
    });
  }
}
