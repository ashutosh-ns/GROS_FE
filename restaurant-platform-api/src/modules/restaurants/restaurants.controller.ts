import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import {
  CreateRestaurantSchema,
  UpdateRestaurantSchema,
  InviteMemberSchema,
  CreateRestaurantDto,
  UpdateRestaurantDto,
  InviteMemberDto,
} from './dto/restaurants.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, TenantGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, CurrentRestaurant, Roles } from '../../common/decorators';

@ApiTags('Restaurants')
@Controller('restaurants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RestaurantsController {
  constructor(private restaurantsService: RestaurantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new restaurant (becomes owner)' })
  @UsePipes(new ZodValidationPipe(CreateRestaurantSchema))
  async create(@Body() dto: CreateRestaurantDto, @CurrentUser() user: { id: string }) {
    return this.restaurantsService.create(dto, user.id);
  }

  @Get(':restaurantId')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Get restaurant details' })
  async findOne(@Param('restaurantId') restaurantId: string) {
    return this.restaurantsService.findById(restaurantId);
  }

  @Patch(':restaurantId')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update restaurant details' })
  @UsePipes(new ZodValidationPipe(UpdateRestaurantSchema))
  async update(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.update(restaurantId, dto);
  }

  @Post(':restaurantId/members')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Invite a member to the restaurant' })
  @UsePipes(new ZodValidationPipe(InviteMemberSchema))
  async inviteMember(
    @CurrentRestaurant() restaurantId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.restaurantsService.inviteMember(restaurantId, dto);
  }

  @Delete(':restaurantId/members/:memberId')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Remove a member from the restaurant' })
  async removeMember(
    @CurrentRestaurant() restaurantId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.restaurantsService.removeMember(restaurantId, memberId, user.id);
  }

  @Patch(':restaurantId/members/:memberId/role')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('OWNER')
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(
    @CurrentRestaurant() restaurantId: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: 'MANAGER' | 'WAITER' | 'CASHIER' | 'KITCHEN' | 'STAFF' },
  ) {
    return this.restaurantsService.updateMemberRole(restaurantId, memberId, body.role);
  }
}
