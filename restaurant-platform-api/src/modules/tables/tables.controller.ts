import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { CreateTableSchema, UpdateTableSchema, CreateTableDto, UpdateTableDto } from './dto/tables.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, TenantGuard, RolesGuard } from '../../common/guards';
import { CurrentRestaurant, Roles } from '../../common/decorators';

@ApiTags('Tables')
@Controller('restaurants/:restaurantId/tables')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class TablesController {
  constructor(private tablesService: TablesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tables for a restaurant' })
  async findAll(@CurrentRestaurant() restaurantId: string) {
    return this.tablesService.findAll(restaurantId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create a new table' })
  @UsePipes(new ZodValidationPipe(CreateTableSchema))
  async create(@CurrentRestaurant() restaurantId: string, @Body() dto: CreateTableDto) {
    return this.tablesService.create(restaurantId, dto);
  }

  @Patch(':tableId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update a table' })
  @UsePipes(new ZodValidationPipe(UpdateTableSchema))
  async update(
    @CurrentRestaurant() restaurantId: string,
    @Param('tableId') tableId: string,
    @Body() dto: UpdateTableDto,
  ) {
    return this.tablesService.update(restaurantId, tableId, dto);
  }

  @Delete(':tableId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Delete a table (soft delete)' })
  async delete(@CurrentRestaurant() restaurantId: string, @Param('tableId') tableId: string) {
    return this.tablesService.delete(restaurantId, tableId);
  }
}
