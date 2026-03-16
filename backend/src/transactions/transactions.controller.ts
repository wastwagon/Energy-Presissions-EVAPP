import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'chargePointId', required: false, type: String })
  @ApiQuery({ name: 'vendorId', required: false, type: Number })
  @ApiHeader({ name: 'X-Vendor-Id', required: false, description: 'Vendor ID for filtering (alternative to query param)' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  async findAll(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('chargePointId') chargePointId?: string,
    @Query('vendorId') vendorId?: number,
    @Headers('x-vendor-id') vendorIdHeader?: string,
  ) {
    // Use query param vendorId or header X-Vendor-Id
    const finalVendorId = vendorId || (vendorIdHeader ? parseInt(vendorIdHeader) : undefined);
    
    return this.transactionsService.findAll(
      limit ? parseInt(limit.toString()) : 100,
      offset ? parseInt(offset.toString()) : 0,
      chargePointId,
      finalVendorId,
    );
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active transactions' })
  @ApiQuery({ name: 'vendorId', required: false, type: Number })
  @ApiHeader({ name: 'X-Vendor-Id', required: false, description: 'Vendor ID for filtering (alternative to query param)' })
  @ApiResponse({ status: 200, description: 'List of active transactions' })
  async findActive(
    @Query('vendorId') vendorId?: number,
    @Headers('x-vendor-id') vendorIdHeader?: string,
  ) {
    // Use query param vendorId or header X-Vendor-Id
    const finalVendorId = vendorId || (vendorIdHeader ? parseInt(vendorIdHeader) : undefined);
    
    return this.transactionsService.findActive(finalVendorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.findOne(id);
  }

  @Get(':id/meter-values')
  @ApiOperation({ summary: 'Get meter values for a transaction' })
  @ApiResponse({ status: 200, description: 'List of meter values' })
  async getMeterValues(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.getMeterValues(id);
  }
}

