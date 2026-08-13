import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ForbiddenException,
  Headers,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { isStaffAccount } from '../common/utils/account-type';

class InitializePaymentDto {
  @IsNumber()
  invoiceId: number;

  @IsEmail()
  email: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

class WalletTopUpDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

type AuthUser = { id: number; accountType: string };

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private assertSelfOrStaff(user: AuthUser, userId: number): void {
    if (isStaffAccount(user.accountType) || user.id === userId) {
      return;
    }
    throw new ForbiddenException('You cannot access this payment');
  }

  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initialize Paystack payment for invoice' })
  @ApiBody({ type: InitializePaymentDto })
  @ApiResponse({ status: 200, description: 'Payment initialized successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async initializePayment(
    @Request() req: { user: AuthUser },
    @Body() dto: InitializePaymentDto,
  ) {
    return this.paymentsService.initializePayment(
      dto.invoiceId,
      dto.email,
      dto.metadata,
      dto.channel,
      dto.phone,
      req.user,
    );
  }

  @Post('wallet/top-up')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initialize Paystack payment to credit the signed-in user wallet' })
  @ApiBody({ type: WalletTopUpDto })
  @ApiResponse({ status: 200, description: 'Wallet top-up initialized' })
  async initializeWalletTopUp(
    @Request() req: { user: AuthUser },
    @Body() dto: WalletTopUpDto,
  ) {
    return this.paymentsService.initializeWalletTopUp(
      req.user.id,
      dto.amount,
      dto.email,
      dto.channel,
      dto.phone,
    );
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack webhook (HMAC-SHA512, public)' })
  @ApiResponse({ status: 200, description: 'Webhook accepted' })
  async handlePaystackWebhook(
    @Headers('x-paystack-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<ExpressRequest>,
  ) {
    if (!signature) {
      throw new UnauthorizedException('Missing Paystack signature');
    }
    return this.paymentsService.handlePaystackWebhook(signature, req.rawBody, req.body);
  }

  @Post('verify/:reference')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify Paystack payment' })
  @ApiResponse({ status: 200, description: 'Payment verified' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async verifyPayment(
    @Request() req: { user: AuthUser },
    @Param('reference') reference: string,
  ) {
    const payment = await this.paymentsService.verifyPayment(reference);
    this.assertSelfOrStaff(req.user, payment.userId);
    return payment;
  }

  @Post('invoice/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Process payment for invoice' })
  @ApiBody({ schema: { properties: { email: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Payment initialized' })
  async processInvoicePayment(
    @Request() req: { user: AuthUser },
    @Param('invoiceId', ParseIntPipe) invoiceId: number,
    @Body('email') email: string,
  ) {
    return this.paymentsService.processPaymentForInvoice(invoiceId, email, undefined, undefined, req.user);
  }

  @Post('transaction/:transactionId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Process payment for transaction (supports mobile money)' })
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string' },
        channel: { type: 'string', description: 'Payment channel: card, mobile_money, bank, ussd, qr' },
        phone: { type: 'string', description: 'Phone number for mobile money payments' },
      },
      required: ['email'],
    },
  })
  @ApiResponse({ status: 200, description: 'Payment initialized' })
  async processTransactionPayment(
    @Request() req: { user: AuthUser },
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Body('email') email: string,
    @Body('channel') channel?: string,
    @Body('phone') phone?: string,
  ) {
    return this.paymentsService.processPaymentForTransaction(
      transactionId,
      email,
      channel,
      phone,
      req.user,
    );
  }

  @Get('all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Admin')
  @ApiOperation({ summary: 'Get all payments (Admin/SuperAdmin)' })
  @ApiResponse({ status: 200, description: 'List of all payments' })
  async getAllPayments(
    @Request() req: { user: { accountType: string; vendorId?: number } },
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const vendorId = req.user.accountType === 'Admin' ? req.user.vendorId : undefined;
    return this.paymentsService.getAllPayments(
      limit ? parseInt(limit.toString(), 10) : 100,
      offset ? parseInt(offset.toString(), 10) : 0,
      vendorId,
    );
  }

  @Get('public-key')
  @ApiOperation({ summary: 'Get Paystack public key' })
  @ApiResponse({ status: 200, description: 'Public key' })
  async getPublicKey() {
    return { publicKey: this.paymentsService.getPublicKey() };
  }

  @Get('user/:userId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payments for user' })
  @ApiResponse({ status: 200, description: 'List of payments' })
  async getUserPayments(
    @Request() req: { user: AuthUser },
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    this.assertSelfOrStaff(req.user, userId);
    return this.paymentsService.getUserPayments(
      userId,
      limit ? parseInt(limit.toString(), 10) : 50,
      offset ? parseInt(offset.toString(), 10) : 0,
    );
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(
    @Request() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payment = await this.paymentsService.getPayment(id);
    this.assertSelfOrStaff(req.user, payment.userId);
    return payment;
  }

  @Post('wallet/invoice/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Process payment using wallet for invoice' })
  @ApiBody({ schema: { properties: { userId: { type: 'number' } } } })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  async processWalletPaymentForInvoice(
    @Request() req: { user: AuthUser },
    @Param('invoiceId', ParseIntPipe) invoiceId: number,
    @Body('userId') bodyUserId?: number,
  ) {
    const userId =
      isStaffAccount(req.user.accountType) && bodyUserId ? bodyUserId : req.user.id;
    return this.paymentsService.processWalletPayment(invoiceId, userId);
  }

  @Post('wallet/transaction/:transactionId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Process payment using wallet for transaction' })
  @ApiBody({ schema: { properties: { userId: { type: 'number' } } } })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  async processWalletPaymentForTransaction(
    @Request() req: { user: AuthUser },
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Body('userId') bodyUserId?: number,
  ) {
    const userId =
      isStaffAccount(req.user.accountType) && bodyUserId ? bodyUserId : req.user.id;
    return this.paymentsService.processWalletPaymentForTransaction(transactionId, userId);
  }

  @Post('cash/transaction/:transactionId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Admin')
  @ApiOperation({ summary: 'Process cash payment for walk-in customer' })
  @ApiBody({
    schema: {
      properties: {
        amount: { type: 'number' },
        receivedBy: { type: 'number' },
        notes: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Cash payment processed' })
  async processCashPayment(
    @Request() req: { user: AuthUser },
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Body() body: { amount?: number; receivedBy?: number; notes?: string },
  ) {
    return this.paymentsService.processCashPayment(
      transactionId,
      body.amount,
      req.user.id,
      body.notes,
    );
  }
}
