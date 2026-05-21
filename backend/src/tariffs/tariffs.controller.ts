import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TariffsService } from './tariffs.service';
import { Tariff } from '../entities/tariff.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

type RequestUser = {
  accountType: string;
  vendorId?: number;
};

@ApiTags('Tariffs')
@ApiBearerAuth()
@Controller('admin/tariffs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SuperAdmin', 'Admin')
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  private listVendorId(user: RequestUser): number | undefined {
    if (user.accountType === 'Admin' && user.vendorId) {
      return user.vendorId;
    }
    return undefined;
  }

  private assertCanMutateTariff(user: RequestUser, tariff: Tariff): void {
    if (user.accountType === 'Admin' && user.vendorId) {
      if (tariff.vendorId == null) {
        throw new ForbiddenException('Network-wide tariffs can only be changed by a super admin');
      }
      if (tariff.vendorId !== user.vendorId) {
        throw new ForbiddenException('Tariff is outside your vendor scope');
      }
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all tariffs' })
  @ApiResponse({ status: 200, description: 'List of tariffs', type: [Tariff] })
  async findAll(@Request() req: { user: RequestUser }): Promise<Tariff[]> {
    return this.tariffsService.findAll(this.listVendorId(req.user));
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active tariff' })
  @ApiResponse({ status: 200, description: 'Active tariff', type: Tariff })
  async getActive(
    @Request() req: { user: RequestUser },
    @Query('currency') currency?: string,
  ): Promise<Tariff | null> {
    return this.tariffsService.getActiveTariff(currency, this.listVendorId(req.user));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tariff by ID' })
  @ApiResponse({ status: 200, description: 'Tariff details', type: Tariff })
  @ApiResponse({ status: 404, description: 'Tariff not found' })
  async findOne(
    @Request() req: { user: RequestUser },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Tariff> {
    const tariff = await this.tariffsService.findOne(id);
    this.assertCanMutateTariff(req.user, tariff);
    return tariff;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tariff' })
  @ApiResponse({ status: 201, description: 'Tariff created', type: Tariff })
  async create(
    @Request() req: { user: RequestUser },
    @Body()
    data: {
      name: string;
      description?: string;
      energyRate?: number;
      timeRate?: number;
      baseFee?: number;
      currency?: string;
      validFrom?: Date;
      validTo?: Date;
      vendorId?: number | null;
    },
  ): Promise<Tariff> {
    const vendorId =
      req.user.accountType === 'Admin' && req.user.vendorId
        ? req.user.vendorId
        : data.vendorId ?? null;

    return this.tariffsService.create({ ...data, vendorId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tariff' })
  @ApiResponse({ status: 200, description: 'Tariff updated', type: Tariff })
  async update(
    @Request() req: { user: RequestUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<Tariff>,
  ): Promise<Tariff> {
    const existing = await this.tariffsService.findOne(id);
    this.assertCanMutateTariff(req.user, existing);
    if (req.user.accountType === 'Admin' && req.user.vendorId && data.vendorId != null) {
      data.vendorId = req.user.vendorId;
    }
    return this.tariffsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tariff' })
  @ApiResponse({ status: 204, description: 'Tariff deleted' })
  async delete(
    @Request() req: { user: RequestUser },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const existing = await this.tariffsService.findOne(id);
    this.assertCanMutateTariff(req.user, existing);
    return this.tariffsService.delete(id);
  }
}
