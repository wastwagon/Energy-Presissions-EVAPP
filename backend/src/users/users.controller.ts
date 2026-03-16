import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SelfOrAdminGuard } from '../common/guards/self-or-admin.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'Admin')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(SelfOrAdminGuard)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'Admin')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  async create(@Body() data: Partial<User>): Promise<User> {
    return this.usersService.create(data);
  }

  @Put(':id')
  @UseGuards(SelfOrAdminGuard)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<User>,
  ): Promise<User> {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SelfOrAdminGuard)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.delete(id);
  }

  @Get(':id/id-tags')
  @UseGuards(SelfOrAdminGuard)
  @ApiOperation({ summary: 'Get user IdTags' })
  @ApiResponse({ status: 200, description: 'List of IdTags' })
  async getIdTags(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getIdTags(id);
  }

  @Put(':id/role')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'Admin')
  @ApiOperation({ summary: 'Change user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { accountType: string },
  ): Promise<User> {
    return this.usersService.update(id, { accountType: body.accountType });
  }

  @Get(':id/favorites')
  @UseGuards(SelfOrAdminGuard)
  @ApiOperation({ summary: 'Get user favorite stations' })
  @ApiResponse({ status: 200, description: 'List of favorite charge point IDs' })
  async getFavorites(@Param('id', ParseIntPipe) id: number): Promise<string[]> {
    return this.usersService.getFavorites(id);
  }

  @Post(':id/favorites/:chargePointId')
  @UseGuards(SelfOrAdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add station to favorites' })
  @ApiResponse({ status: 201, description: 'Added to favorites' })
  async addFavorite(
    @Param('id', ParseIntPipe) id: number,
    @Param('chargePointId') chargePointId: string,
  ): Promise<void> {
    return this.usersService.addFavorite(id, chargePointId);
  }

  @Delete(':id/favorites/:chargePointId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SelfOrAdminGuard)
  @ApiOperation({ summary: 'Remove station from favorites' })
  @ApiResponse({ status: 204, description: 'Removed from favorites' })
  async removeFavorite(
    @Param('id', ParseIntPipe) id: number,
    @Param('chargePointId') chargePointId: string,
  ): Promise<void> {
    return this.usersService.removeFavorite(id, chargePointId);
  }
}

