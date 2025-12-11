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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

class InitializePaymentDto {
  invoiceId: number;
  email: string;
  metadata?: Record<string, any>;
}

class ProcessTransactionPaymentDto {
  transactionId: number;
  email: string;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialize Paystack payment for invoice' })
  @ApiBody({ type: InitializePaymentDto })
  @ApiResponse({ status: 200, description: 'Payment initialized successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async initializePayment(@Body() dto: InitializePaymentDto) {
    return this.paymentsService.initializePayment(dto.invoiceId, dto.email, dto.metadata);
  }

  @Post('verify/:reference')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Paystack payment' })
  @ApiResponse({ status: 200, description: 'Payment verified' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async verifyPayment(@Param('reference') reference: string) {
    return this.paymentsService.verifyPayment(reference);
  }

  @Post('invoice/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process payment for invoice' })
  @ApiBody({ schema: { properties: { email: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Payment initialized' })
  async processInvoicePayment(
    @Param('invoiceId', ParseIntPipe) invoiceId: number,
    @Body('email') email: string,
  ) {
    return this.paymentsService.processPaymentForInvoice(invoiceId, email);
  }

  @Post('transaction/:transactionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process payment for transaction' })
  @ApiBody({ schema: { properties: { email: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Payment initialized' })
  async processTransactionPayment(
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Body('email') email: string,
  ) {
    return this.paymentsService.processPaymentForTransaction(transactionId, email);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.getPayment(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get payments for user' })
  @ApiResponse({ status: 200, description: 'List of payments' })
  async getUserPayments(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.paymentsService.getUserPayments(
      userId,
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0,
    );
  }

  @Get('public-key')
  @ApiOperation({ summary: 'Get Paystack public key' })
  @ApiResponse({ status: 200, description: 'Public key' })
  async getPublicKey() {
    return { publicKey: this.paymentsService.getPublicKey() };
  }

  @Post('wallet/invoice/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process payment using wallet for invoice' })
  @ApiBody({ schema: { properties: { userId: { type: 'number' } } } })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  async processWalletPaymentForInvoice(
    @Param('invoiceId', ParseIntPipe) invoiceId: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.paymentsService.processWalletPayment(invoiceId, userId);
  }

  @Post('wallet/transaction/:transactionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process payment using wallet for transaction' })
  @ApiBody({ schema: { properties: { userId: { type: 'number' } } } })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  async processWalletPaymentForTransaction(
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.paymentsService.processWalletPaymentForTransaction(
      transactionId,
      userId,
    );
  }

  @Post('cash/transaction/:transactionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process cash payment for walk-in customer' })
  @ApiBody({
    schema: {
      properties: {
        amount: { type: 'number' },
        receivedBy: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['receivedBy'],
    },
  })
  @ApiResponse({ status: 200, description: 'Cash payment processed' })
  async processCashPayment(
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Body() body: { amount?: number; receivedBy: number; notes?: string },
  ) {
    return this.paymentsService.processCashPayment(
      transactionId,
      body.amount,
      body.receivedBy,
      body.notes,
    );
  }
}

