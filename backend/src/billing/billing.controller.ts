import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('transactions')
  @ApiOperation({ summary: 'Get transactions for billing' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  async getTransactions(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('userId') userId?: number,
  ) {
    return this.billingService.getTransactions(
      limit ? parseInt(limit.toString()) : 100,
      offset ? parseInt(offset.toString()) : 0,
      userId ? parseInt(userId.toString()) : undefined,
    );
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get invoices' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async getInvoices(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('userId') userId?: number,
  ) {
    return this.billingService.getInvoices(
      limit ? parseInt(limit.toString()) : 100,
      offset ? parseInt(offset.toString()) : 0,
      userId ? parseInt(userId.toString()) : undefined,
    );
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.getInvoice(id);
  }

  @Post('transactions/:transactionId/calculate')
  @ApiOperation({ summary: 'Calculate cost for a transaction' })
  @ApiResponse({ status: 200, description: 'Cost calculated' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async calculateTransactionCost(
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    return this.billingService.calculateTransactionCost(transactionId);
  }

  @Post('transactions/:transactionId/invoice')
  @ApiOperation({ summary: 'Generate invoice for a transaction' })
  @ApiResponse({ status: 201, description: 'Invoice generated' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async generateInvoice(
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    return this.billingService.generateInvoice(transactionId);
  }
}

