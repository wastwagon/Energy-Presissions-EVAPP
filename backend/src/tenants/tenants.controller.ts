import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { Tenant, TenantStatus } from '../entities/tenant.entity';
import { TenantStatusGuard, SkipTenantCheck } from '../common/guards/tenant-status.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Tenants')
@Controller('admin/tenants')
@UseGuards(TenantStatusGuard, RolesGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Roles('SuperAdmin')
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({ status: 200, description: 'List of tenants', type: [Tenant] })
  async findAll(): Promise<Tenant[]> {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @Roles('SuperAdmin')
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({ status: 200, description: 'Tenant details', type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Tenant> {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/status')
  @Roles('SuperAdmin')
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Get tenant status with history' })
  @ApiResponse({
    status: 200,
    description: 'Tenant status information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'suspended', 'disabled'] },
        reason: { type: 'string' },
        effectiveAt: { type: 'string', format: 'date-time' },
        updatedBy: { type: 'number' },
        history: { type: 'array' },
      },
    },
  })
  async getStatus(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.getStatus(id);
  }

  @Post()
  @Roles('SuperAdmin')
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created', type: Tenant })
  async create(@Body() createTenantDto: {
    name: string;
    slug?: string;
    domain?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    metadata?: Record<string, any>;
  }): Promise<Tenant> {
    return this.tenantsService.create(createTenantDto);
  }

  @Put(':id')
  @Roles('SuperAdmin')
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated', type: Tenant })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTenantDto: Partial<Tenant>,
  ): Promise<Tenant> {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Put(':id/status')
  @Roles('SuperAdmin')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change tenant status' })
  @ApiResponse({
    status: 200,
    description: 'Status changed successfully',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        appliedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: TenantStatus; reason?: string },
    @Request() req: any,
  ): Promise<{ ok: boolean; appliedAt: string }> {
    const byUserId = req.user?.id || 1;
    return this.tenantsService.changeStatus(id, body.status, body.reason || '', byUserId);
  }

  @Delete(':id')
  @Roles('SuperAdmin')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tenant (soft delete - sets to disabled)' })
  @ApiResponse({ status: 204, description: 'Tenant disabled' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    const byUserId = req.user?.id || 1;
    return this.tenantsService.delete(id, byUserId);
  }

  @Post(':id/login')
  @Roles('SuperAdmin')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login as tenant (Super Admin impersonation)' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in as tenant',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        tenantId: { type: 'number' },
      },
    },
  })
  async loginAsTenant(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string; tenantId: number }> {
    return this.tenantsService.loginAsTenant(id, req.user?.id);
  }
}
