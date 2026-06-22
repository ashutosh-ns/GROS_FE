import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: { id: string }) {
    return this.usersService.findById(user.id);
  }

  @Get('me/restaurants')
  @ApiOperation({ summary: 'Get restaurants the current user belongs to' })
  async getMyRestaurants(@CurrentUser() user: { id: string }) {
    return this.usersService.getMyRestaurants(user.id);
  }
}
