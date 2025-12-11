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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TariffsService } from './tariffs.service';
import { Tariff } from '../entities/tariff.entity';

@ApiTags('Tariffs')
@Controller('admin/tariffs')
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tariffs' })
  @ApiResponse({ status: 200, description: 'List of tariffs', type: [Tariff] })
  async findAll(): Promise<Tariff[]> {
    return this.tariffsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active tariff' })
  @ApiResponse({ status: 200, description: 'Active tariff', type: Tariff })
  async getActive(@Query('currency') currency?: string): Promise<Tariff | null> {
    return this.tariffsService.getActiveTariff(currency);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tariff by ID' })
  @ApiResponse({ status: 200, description: 'Tariff details', type: Tariff })
  @ApiResponse({ status: 404, description: 'Tariff not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Tariff> {
    return this.tariffsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tariff' })
  @ApiResponse({ status: 201, description: 'Tariff created', type: Tariff })
  async create(@Body() data: {
    name: string;
    description?: string;
    energyRate?: number;
    timeRate?: number;
    baseFee?: number;
    currency?: string;
    validFrom?: Date;
    validTo?: Date;
  }): Promise<Tariff> {
    return this.tariffsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tariff' })
  @ApiResponse({ status: 200, description: 'Tariff updated', type: Tariff })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<Tariff>,
  ): Promise<Tariff> {
    return this.tariffsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tariff' })
  @ApiResponse({ status: 204, description: 'Tariff deleted' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tariffsService.delete(id);
  }
}

