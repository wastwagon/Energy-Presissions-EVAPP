import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

type RequestUser = {
  id: number;
  accountType: string;
  vendorId?: number;
};

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SuperAdmin', 'Admin')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  private resolveVendorId(user: RequestUser): number | undefined {
    if (user.accountType === 'Admin' && user.vendorId) {
      return user.vendorId;
    }
    return undefined;
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transactions for billing' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  async getTransactions(
    @Request() req: { user: RequestUser },
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('userId') userId?: number,
  ) {
    const vendorId = this.resolveVendorId(req.user);
    return this.billingService.getTransactions(
      limit ? parseInt(limit.toString(), 10) : 100,
      offset ? parseInt(offset.toString(), 10) : 0,
      userId ? parseInt(userId.toString(), 10) : undefined,
      vendorId,
    );
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get invoices' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async getInvoices(
    @Request() req: { user: RequestUser },
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('userId') userId?: number,
  ) {
    const vendorId = this.resolveVendorId(req.user);
    return this.billingService.getInvoices(
      limit ? parseInt(limit.toString(), 10) : 100,
      offset ? parseInt(offset.toString(), 10) : 0,
      userId ? parseInt(userId.toString(), 10) : undefined,
      vendorId,
    );
  }

  @Get('transactions/:transactionId/invoice')
  @ApiOperation({ summary: 'Get invoice for a transaction if it exists' })
  @ApiResponse({ status: 200, description: 'Invoice or null' })
  async getInvoiceForTransaction(
    @Request() req: { user: RequestUser },
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    return this.billingService.getInvoiceByTransactionId(
      transactionId,
      this.resolveVendorId(req.user),
    );
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoice(
    @Request() req: { user: RequestUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.billingService.getInvoice(id, this.resolveVendorId(req.user));
  }

  @Post('transactions/:transactionId/calculate')
  @ApiOperation({ summary: 'Calculate cost for a transaction' })
  @ApiResponse({ status: 200, description: 'Cost calculated' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async calculateTransactionCost(
    @Request() req: { user: RequestUser },
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    return this.billingService.calculateTransactionCost(
      transactionId,
      this.resolveVendorId(req.user),
    );
  }

  @Post('transactions/:transactionId/invoice')
  @ApiOperation({ summary: 'Generate invoice for a transaction' })
  @ApiResponse({ status: 201, description: 'Invoice generated' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async generateInvoice(
    @Request() req: { user: RequestUser },
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    return this.billingService.generateInvoice(
      transactionId,
      this.resolveVendorId(req.user),
    );
  }
}
