import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Headers,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

type RequestUser = {
  id: number;
  accountType: string;
  vendorId?: number;
};

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  private resolveUserIdFilter(user: RequestUser, queryUserId?: number): number | undefined {
    if (user.accountType === 'Customer' || user.accountType === 'WalkIn') {
      return user.id;
    }
    return queryUserId != null ? parseInt(String(queryUserId), 10) : undefined;
  }

  private resolveVendorIdFilter(
    user: RequestUser,
    queryVendorId?: number,
    vendorIdHeader?: string,
  ): number | undefined {
    if (user.accountType === 'Admin' && user.vendorId) {
      return user.vendorId;
    }
    if (user.accountType === 'SuperAdmin') {
      const fromQuery = queryVendorId != null ? parseInt(String(queryVendorId), 10) : undefined;
      const fromHeader = vendorIdHeader ? parseInt(vendorIdHeader, 10) : undefined;
      return fromQuery ?? (Number.isFinite(fromHeader) ? fromHeader : undefined);
    }
    return undefined;
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'chargePointId', required: false, type: String })
  @ApiQuery({ name: 'vendorId', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiHeader({ name: 'X-Vendor-Id', required: false, description: 'Vendor ID for filtering (Super Admin impersonation)' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  async findAll(
    @Request() req: { user: RequestUser },
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('chargePointId') chargePointId?: string,
    @Query('vendorId') vendorId?: number,
    @Query('userId') userId?: number,
    @Headers('x-vendor-id') vendorIdHeader?: string,
  ) {
    const finalVendorId = this.resolveVendorIdFilter(req.user, vendorId, vendorIdHeader);
    const finalUserId = this.resolveUserIdFilter(req.user, userId);

    return this.transactionsService.findAll(
      limit ? parseInt(limit.toString(), 10) : 100,
      offset ? parseInt(offset.toString(), 10) : 0,
      chargePointId,
      finalVendorId,
      finalUserId,
    );
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active transactions' })
  @ApiQuery({ name: 'vendorId', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiHeader({ name: 'X-Vendor-Id', required: false, description: 'Vendor ID for filtering (Super Admin impersonation)' })
  @ApiResponse({ status: 200, description: 'List of active transactions' })
  async findActive(
    @Request() req: { user: RequestUser },
    @Query('vendorId') vendorId?: number,
    @Query('userId') userId?: number,
    @Headers('x-vendor-id') vendorIdHeader?: string,
  ) {
    const finalVendorId = this.resolveVendorIdFilter(req.user, vendorId, vendorIdHeader);
    const finalUserId = this.resolveUserIdFilter(req.user, userId);

    return this.transactionsService.findActive(finalVendorId, finalUserId);
  }

  @Get(':id/meter-values')
  @ApiOperation({ summary: 'Get meter values for a transaction' })
  @ApiResponse({ status: 200, description: 'List of meter values' })
  async getMeterValues(@Request() req: { user: RequestUser }, @Param('id', ParseIntPipe) id: number) {
    await this.transactionsService.assertTransactionAccessByOcppId(id, req.user);
    return this.transactionsService.getMeterValues(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(@Request() req: { user: RequestUser }, @Param('id', ParseIntPipe) id: number) {
    await this.transactionsService.assertTransactionAccessByOcppId(id, req.user);
    return this.transactionsService.findOne(id);
  }
}
