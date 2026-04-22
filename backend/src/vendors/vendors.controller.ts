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
  HttpException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { readFile } from 'fs/promises';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { VendorStatusService } from './vendor-status.service';
import { Vendor, VendorStatus } from '../entities/vendor.entity';
import { VendorStatusGuard, SkipVendorCheck } from '../common/guards/vendor-status.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Vendors')
@Controller('admin/vendors')
@UseGuards(JwtAuthGuard, VendorStatusGuard, RolesGuard)
@ApiBearerAuth()
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @Roles('SuperAdmin')
  @SkipVendorCheck()
  @ApiOperation({ summary: 'Get all vendors' })
  @ApiResponse({ status: 200, description: 'List of vendors', type: [Vendor] })
  async findAll(@Request() _req: any): Promise<Vendor[]> {
    try {
      return await this.vendorsService.findAll();
    } catch (error: any) {
      throw new HttpException(
        `Failed to fetch vendors: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/logo')
  @Roles('SuperAdmin', 'Admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload vendor logo to object storage' })
  @ApiResponse({ status: 200, description: 'Vendor with updated logo_url', type: Vendor })
  async uploadLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile()
    file: { buffer?: Buffer; path?: string; originalname: string; mimetype: string },
    @Request() req: any,
  ): Promise<Vendor> {
    if (req.user?.accountType !== 'SuperAdmin' && req.user?.vendorId !== id) {
      throw new HttpException('Forbidden - can only update own vendor', HttpStatus.FORBIDDEN);
    }
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const buffer = file.buffer
      ? file.buffer
      : file.path
        ? await readFile(file.path)
        : null;
    if (!buffer) {
      throw new BadRequestException('Could not read uploaded file');
    }
    return this.vendorsService.uploadLogo(id, buffer, file.originalname, file.mimetype);
  }

  @Get(':id')
  @Roles('SuperAdmin', 'Admin')
  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiResponse({ status: 200, description: 'Vendor details', type: Vendor })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only access own vendor' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<Vendor> {
    // SuperAdmin can access any vendor, Admin can only access their own
    if (req.user?.accountType !== 'SuperAdmin' && req.user?.vendorId !== id) {
      throw new HttpException('Forbidden - can only access own vendor', HttpStatus.FORBIDDEN);
    }
    return this.vendorsService.findOne(id);
  }

  @Get(':id/status')
  @Roles('SuperAdmin')
  @SkipVendorCheck()
  @ApiOperation({ summary: 'Get vendor status with history' })
  @ApiResponse({
    status: 200,
    description: 'Vendor status information',
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
    return this.vendorsService.getStatus(id);
  }

  @Post()
  @Roles('SuperAdmin')
  @SkipVendorCheck()
  @ApiOperation({ summary: 'Create a new vendor' })
  @ApiResponse({ status: 201, description: 'Vendor created', type: Vendor })
  async create(@Body() createVendorDto: {
    name: string;
    slug?: string;
    domain?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    metadata?: Record<string, any>;
  }): Promise<Vendor> {
    return this.vendorsService.create(createVendorDto);
  }

  @Put(':id')
  @Roles('SuperAdmin', 'Admin')
  @ApiOperation({ summary: 'Update vendor' })
  @ApiResponse({ status: 200, description: 'Vendor updated', type: Vendor })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update own vendor' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVendorDto: Partial<Vendor>,
    @Request() req: any,
  ): Promise<Vendor> {
    // SuperAdmin can update any vendor, Admin can only update their own
    if (req.user?.accountType !== 'SuperAdmin' && req.user?.vendorId !== id) {
      throw new HttpException('Forbidden - can only update own vendor', HttpStatus.FORBIDDEN);
    }
    return this.vendorsService.update(id, updateVendorDto);
  }

  @Put(':id/status')
  @Roles('SuperAdmin')
  @SkipVendorCheck()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change vendor status' })
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
    @Body() body: { status: VendorStatus; reason?: string },
    @Request() req: any,
  ): Promise<{ ok: boolean; appliedAt: string }> {
    const byUserId = req.user?.id;
    if (!byUserId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return this.vendorsService.changeStatus(id, body.status, body.reason || '', byUserId);
  }

  @Delete(':id')
  @Roles('SuperAdmin')
  @SkipVendorCheck()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete vendor (soft delete - sets to disabled)' })
  @ApiResponse({ status: 204, description: 'Vendor disabled' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    const byUserId = req.user?.id;
    if (!byUserId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return this.vendorsService.delete(id, byUserId);
  }

  @Post(':id/login')
  @Roles('SuperAdmin')
  @SkipVendorCheck()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login as vendor (Super Admin impersonation)' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in as vendor',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        vendorId: { type: 'number' },
      },
    },
  })
  async loginAsVendor(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string; vendorId: number }> {
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return this.vendorsService.loginAsVendor(id, adminUserId);
  }
}

// Vendor portal controller (for users to access their own vendor info)
@ApiTags('Vendor Portal')
@Controller('vendor')
@UseGuards(JwtAuthGuard, VendorStatusGuard)
@ApiBearerAuth()
export class VendorPortalController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly vendorStatusService: VendorStatusService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current user vendor status' })
  @ApiResponse({ status: 200, description: 'Vendor status', schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['active', 'suspended', 'disabled'] },
      reason: { type: 'string' },
    },
  }})
  async getCurrentVendorStatus(@Request() req: any): Promise<{ status: VendorStatus; reason?: string }> {
    const vendorId = req.user?.vendorId;
    if (!vendorId) {
      throw new HttpException('User has no vendor assigned', HttpStatus.BAD_REQUEST);
    }
    
    const status = await this.vendorStatusService.getVendorStatus(vendorId);
    return { status };
  }
}

