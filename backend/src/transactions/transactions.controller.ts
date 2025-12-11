import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
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
  @ApiResponse({ status: 200, description: 'List of transactions' })
  async findAll(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('chargePointId') chargePointId?: string,
  ) {
    return this.transactionsService.findAll(
      limit ? parseInt(limit.toString()) : 100,
      offset ? parseInt(offset.toString()) : 0,
      chargePointId,
    );
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active transactions' })
  @ApiResponse({ status: 200, description: 'List of active transactions' })
  async findActive() {
    return this.transactionsService.findActive();
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

