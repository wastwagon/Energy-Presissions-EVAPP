import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { Payment } from '../entities/payment.entity';
import { Invoice } from '../entities/invoice.entity';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { BillingService } from '../billing/billing.service';
import { WalletService } from '../wallet/wallet.service';
import { TenantStatusService } from '../tenants/tenant-status.service';

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    amount: number;
    currency: string;
    transaction_date: string;
    status: string;
    reference: string;
    gateway_response: string;
    customer: {
      email: string;
    };
    authorization: {
      authorization_code: string;
      card_type: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      bank: string;
    };
  };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly paystackSecretKey: string;
  private readonly paystackPublicKey: string;
  private readonly paystackBaseUrl = 'https://api.paystack.co';

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private billingService: BillingService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
    private configService: ConfigService,
    private tenantStatusService: TenantStatusService,
  ) {
    this.paystackSecretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    this.paystackPublicKey = this.configService.get<string>('PAYSTACK_PUBLIC_KEY') || '';

    if (!this.paystackSecretKey || !this.paystackPublicKey) {
      this.logger.warn('Paystack keys not configured. Payment processing will fail.');
    }
  }

  /**
   * Initialize Paystack payment
   */
  async initializePayment(
    invoiceId: number,
    email: string,
    metadata?: Record<string, any>,
  ): Promise<{ authorizationUrl: string; reference: string; accessCode: string }> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['user'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    if (invoice.status === 'Paid') {
      throw new BadRequestException('Invoice is already paid');
    }

    // Convert amount to kobo (Paystack uses smallest currency unit)
    // For GHS, 1 GHS = 100 pesewas
    const amountInPesewas = Math.round(invoice.total * 100);

    try {
      const response = await axios.post<PaystackInitializeResponse>(
        `${this.paystackBaseUrl}/transaction/initialize`,
        {
          email,
          amount: amountInPesewas,
          currency: invoice.currency || 'GHS',
          reference: `INV-${invoice.invoiceNumber}-${Date.now()}`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            transactionId: invoice.transactionId,
            ...metadata,
          },
          callback_url: this.configService.get<string>('PAYSTACK_CALLBACK_URL') || '',
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to initialize payment');
      }

      // Create payment record
      const payment = this.paymentRepository.create({
        transactionId: invoice.transactionId,
        userId: invoice.userId,
        amount: invoice.total,
        currency: invoice.currency || 'GHS',
        paymentMethod: 'Card',
        paymentGateway: 'Paystack',
        paymentGatewayId: response.data.data.reference,
        status: 'Pending',
      });

      await this.paymentRepository.save(payment);

      return {
        authorizationUrl: response.data.data.authorization_url,
        reference: response.data.data.reference,
        accessCode: response.data.data.access_code,
      };
    } catch (error: any) {
      this.logger.error('Error initializing Paystack payment:', error);
      if (error.response?.data) {
        throw new BadRequestException(
          error.response.data.message || 'Failed to initialize payment',
        );
      }
      throw new BadRequestException('Failed to initialize payment');
    }
  }

  /**
   * Verify Paystack payment
   */
  async verifyPayment(reference: string): Promise<Payment> {
    try {
      const response = await axios.get<PaystackVerifyResponse>(
        `${this.paystackBaseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
          },
        },
      );

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Payment verification failed');
      }

      const paymentData = response.data.data;

      // Find payment by reference
      const payment = await this.paymentRepository.findOne({
        where: { paymentGatewayId: reference },
        relations: ['transaction'],
      });

      if (!payment) {
        throw new NotFoundException(`Payment with reference ${reference} not found`);
      }

      // Update payment status
      if (paymentData.status === 'success') {
        payment.status = 'Succeeded';
        payment.processedAt = new Date(paymentData.transaction_date);
        payment.paymentMethod = paymentData.authorization?.card_type || 'Card';

        // Update invoice status
        const invoice = await this.invoiceRepository.findOne({
          where: { transactionId: payment.transactionId },
        });

        if (invoice) {
          invoice.status = 'Paid';
          invoice.paidAt = new Date();
          await this.invoiceRepository.save(invoice);
        }
      } else {
        payment.status = 'Failed';
        payment.failureReason = paymentData.gateway_response;
        payment.processedAt = new Date(paymentData.transaction_date);
      }

      return this.paymentRepository.save(payment);
    } catch (error: any) {
      this.logger.error('Error verifying Paystack payment:', error);
      if (error.response?.data) {
        throw new BadRequestException(
          error.response.data.message || 'Payment verification failed',
        );
      }
      throw new BadRequestException('Payment verification failed');
    }
  }

  /**
   * Process payment for invoice
   */
  async processPaymentForInvoice(
    invoiceId: number,
    email: string,
  ): Promise<{ authorizationUrl: string; reference: string }> {
    const result = await this.initializePayment(invoiceId, email);
    return {
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
    };
  }

  /**
   * Process payment for transaction
   */
  async processPaymentForTransaction(
    transactionId: number,
    email: string,
  ): Promise<{ authorizationUrl: string; reference: string }> {
    const transaction = await this.transactionRepository.findOne({
      where: { transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    if (transaction.status !== 'Completed') {
      throw new BadRequestException('Transaction is not completed');
    }

    // Generate invoice if not exists
    let invoice = await this.invoiceRepository.findOne({
      where: { transactionId },
    });

    if (!invoice) {
      invoice = await this.billingService.generateInvoice(transactionId);
    }

    return this.processPaymentForInvoice(invoice.id, email);
  }

  /**
   * Get payment by ID
   */
  async getPayment(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['transaction', 'user'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }

    return payment;
  }

  /**
   * Get payments for user
   */
  async getUserPayments(userId: number, limit: number = 50, offset: number = 0) {
    const [payments, total] = await this.paymentRepository.findAndCount({
      where: { userId },
      relations: ['transaction'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { payments, total };
  }

  /**
   * Get Paystack public key
   */
  getPublicKey(): string {
    return this.paystackPublicKey;
  }

  /**
   * Process payment using wallet
   */
  async processWalletPayment(
    invoiceId: number,
    userId: number,
  ): Promise<Payment> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['user'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    if (invoice.status === 'Paid') {
      throw new BadRequestException('Invoice is already paid');
    }

    if (invoice.userId !== userId) {
      throw new BadRequestException('Invoice does not belong to user');
    }

    // Check if user has sufficient balance
    const hasBalance = await this.walletService.hasSufficientBalance(
      userId,
      invoice.total,
    );

    if (!hasBalance) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Deduct from wallet
    const walletTransaction = await this.walletService.deduct(
      userId,
      invoice.total,
      `Payment for invoice ${invoice.invoiceNumber}`,
      undefined,
      invoice.transactionId,
    );

    // Create payment record
    const payment = this.paymentRepository.create({
      transactionId: invoice.transactionId,
      userId,
      amount: invoice.total,
      currency: invoice.currency || 'GHS',
      paymentMethod: 'Wallet',
      paymentGateway: 'Internal',
      paymentGatewayId: walletTransaction.reference,
      status: 'Succeeded',
      processedAt: new Date(),
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Update invoice status
    invoice.status = 'Paid';
    invoice.paidAt = new Date();
    await this.invoiceRepository.save(invoice);

    return savedPayment;
  }

  /**
   * Process payment using wallet for transaction
   */
  async processWalletPaymentForTransaction(
    transactionId: number,
    userId: number,
  ): Promise<Payment> {
    const transaction = await this.transactionRepository.findOne({
      where: { transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    if (transaction.status !== 'Completed') {
      throw new BadRequestException('Transaction is not completed');
    }

    if (transaction.userId !== userId) {
      throw new BadRequestException('Transaction does not belong to user');
    }

    // Generate invoice if not exists
    let invoice = await this.invoiceRepository.findOne({
      where: { transactionId },
    });

    if (!invoice) {
      invoice = await this.billingService.generateInvoice(transactionId);
    }

    return this.processWalletPayment(invoice.id, userId);
  }

  /**
   * Process cash payment for walk-in customers
   */
  async processCashPayment(
    transactionId: number,
    amount: number,
    receivedBy: number, // Admin user ID who received the cash
    notes?: string,
  ): Promise<Payment> {
    const transaction = await this.transactionRepository.findOne({
      where: { transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    if (transaction.status !== 'Completed') {
      throw new BadRequestException('Transaction is not completed');
    }

    // Get or create walk-in user
    const walkInUser = await this.getOrCreateWalkInUser(transaction.chargePointId);

    // Generate invoice if not exists
    let invoice = await this.invoiceRepository.findOne({
      where: { transactionId },
    });

    if (!invoice) {
      invoice = await this.billingService.generateInvoice(transactionId);
    }

    if (invoice.status === 'Paid') {
      throw new BadRequestException('Invoice is already paid');
    }

    // Create payment record for cash payment
    const payment = this.paymentRepository.create({
      transactionId: invoice.transactionId,
      userId: walkInUser.id,
      amount: amount || invoice.total,
      currency: invoice.currency || 'GHS',
      paymentMethod: 'Cash',
      paymentGateway: 'Cash',
      paymentGatewayId: `CASH-${Date.now()}`,
      status: 'Succeeded',
      processedAt: new Date(),
      failureReason: notes,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Update invoice status
    invoice.status = 'Paid';
    invoice.paidAt = new Date();
    await this.invoiceRepository.save(invoice);

    // Update transaction user to walk-in user if not already set
    if (!transaction.userId) {
      transaction.userId = walkInUser.id;
      await this.transactionRepository.save(transaction);
    }

    this.logger.log(`Cash payment processed for transaction ${transactionId}: ${amount} ${invoice.currency}`);

    return savedPayment;
  }

  /**
   * Get or create walk-in user for a tenant
   */
  private async getOrCreateWalkInUser(chargePointId: string): Promise<User> {
    // For now, use default tenant (1)
    // In production, resolve tenant from charge point
    const tenantId = 1;

    // Try to find existing walk-in user for tenant
    const walkInUser = await this.userRepository.findOne({
      where: { 
        email: `walkin@tenant${tenantId}.evcharging.com`,
        accountType: 'WalkIn',
        tenantId,
      },
    });

    if (walkInUser) {
      return walkInUser;
    }

    // Create new walk-in user
    const newWalkInUser = this.userRepository.create({
      email: `walkin@tenant${tenantId}.evcharging.com`,
      passwordHash: await bcrypt.hash('walkin123', 10), // Not used for login
      firstName: 'Walk-In',
      lastName: 'Customer',
      accountType: 'WalkIn',
      balance: 0,
      currency: 'GHS',
      status: 'Active',
      emailVerified: false,
      tenantId,
    });

    return this.userRepository.save(newWalkInUser);
  }
}

