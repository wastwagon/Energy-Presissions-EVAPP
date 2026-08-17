import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { Payment } from '../entities/payment.entity';
import { Invoice } from '../entities/invoice.entity';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { BillingService } from '../billing/billing.service';
import { WalletService } from '../wallet/wallet.service';
import { VendorStatusService } from '../vendors/vendor-status.service';
import { isStaffAccount } from '../common/utils/account-type';

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
    private vendorStatusService: VendorStatusService,
    private dataSource: DataSource,
  ) {
    this.paystackSecretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    this.paystackPublicKey = this.configService.get<string>('PAYSTACK_PUBLIC_KEY') || '';

    if (!this.paystackSecretKey || !this.paystackPublicKey) {
      this.logger.warn('Paystack keys not configured. Payment processing will fail.');
    }
  }

  private getPaystackCallbackUrl(): string {
    const explicit = this.configService.get<string>('PAYSTACK_CALLBACK_URL')?.trim();
    if (explicit) {
      return explicit;
    }
    const frontend =
      this.configService.get<string>('FRONTEND_URL')?.replace(/\/$/, '') ||
      'https://cleanmotion.energyprecisions.com';
    return `${frontend}/user/wallet`;
  }

  private assertInvoiceActor(
    invoiceUserId: number,
    actor?: { id: number; accountType: string },
  ): void {
    if (!actor) {
      return;
    }
    if (isStaffAccount(actor.accountType) || actor.id === invoiceUserId) {
      return;
    }
    throw new ForbiddenException('You cannot pay this invoice');
  }

  /**
   * Initialize Paystack payment
   * Supports multiple payment channels including mobile money (MTN, Vodafone, AirtelTigo)
   */
  async initializePayment(
    invoiceId: number,
    email: string,
    metadata?: Record<string, any>,
    channel?: string, // 'card', 'mobile_money', 'bank', 'ussd', 'qr'
    phone?: string, // For mobile money payments
    actor?: { id: number; accountType: string },
  ): Promise<{ authorizationUrl: string; reference: string; accessCode: string }> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['user'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    this.assertInvoiceActor(invoice.userId, actor);

    if (invoice.status === 'Paid') {
      throw new BadRequestException('Invoice is already paid');
    }

    // Convert amount to kobo (Paystack uses smallest currency unit)
    // For GHS, 1 GHS = 100 pesewas
    const amountInPesewas = Math.round(invoice.total * 100);

    try {
      // Build payment request
      const paymentRequest: any = {
        email,
        amount: amountInPesewas,
        currency: invoice.currency || 'GHS',
        reference: `INV-${invoice.invoiceNumber}-${Date.now()}`,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          transactionId: invoice.transactionId,
          type: 'invoice',
          ...metadata,
        },
        callback_url: this.getPaystackCallbackUrl(),
      };

      // Add channel for mobile money or other payment methods
      if (channel) {
        paymentRequest.channels = [channel];
      } else {
        // Default: allow all channels (card, mobile_money, bank, ussd, qr)
        paymentRequest.channels = ['card', 'mobile_money', 'bank', 'ussd', 'qr'];
      }

      // Add phone number for mobile money
      if (phone && (channel === 'mobile_money' || !channel)) {
        paymentRequest.metadata.phone = phone;
      }

      const response = await axios.post<PaystackInitializeResponse>(
        `${this.paystackBaseUrl}/transaction/initialize`,
        paymentRequest,
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

      // Determine payment method from channel
      let paymentMethod = 'Card';
      if (channel === 'mobile_money') {
        paymentMethod = 'Mobile Money';
      } else if (channel === 'bank') {
        paymentMethod = 'Bank Transfer';
      } else if (channel === 'ussd') {
        paymentMethod = 'USSD';
      } else if (channel === 'qr') {
        paymentMethod = 'QR Code';
      }

      // Create payment record
      const payment = this.paymentRepository.create({
        transactionId: invoice.transactionId,
        userId: invoice.userId,
        amount: invoice.total,
        currency: invoice.currency || 'GHS',
        paymentMethod,
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

  async initializeWalletTopUp(
    userId: number,
    amount: number,
    email: string,
    channel?: string,
    phone?: string,
  ): Promise<{ authorizationUrl: string; reference: string; accessCode: string }> {
    if (amount < 1) {
      throw new BadRequestException('Minimum top-up is GHS 1.00');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const amountInPesewas = Math.round(amount * 100);
    const currency = user.currency || 'GHS';

    try {
      const paymentRequest: Record<string, unknown> = {
        email,
        amount: amountInPesewas,
        currency,
        reference: `WALLET-${userId}-${Date.now()}`,
        metadata: {
          type: 'wallet_topup',
          userId,
        },
        callback_url: this.getPaystackCallbackUrl(),
        channels: channel ? [channel] : ['card', 'mobile_money', 'bank', 'ussd', 'qr'],
      };

      if (phone && (channel === 'mobile_money' || !channel)) {
        (paymentRequest.metadata as Record<string, unknown>).phone = phone;
      }

      const response = await axios.post<PaystackInitializeResponse>(
        `${this.paystackBaseUrl}/transaction/initialize`,
        paymentRequest,
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

      let paymentMethod = 'Card';
      if (channel === 'mobile_money') {
        paymentMethod = 'Mobile Money';
      } else if (channel === 'bank') {
        paymentMethod = 'Bank Transfer';
      } else if (channel === 'ussd') {
        paymentMethod = 'USSD';
      } else if (channel === 'qr') {
        paymentMethod = 'QR Code';
      }

      const payment = this.paymentRepository.create({
        transactionId: null,
        userId,
        amount,
        currency,
        paymentMethod,
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
      this.logger.error('Error initializing wallet top-up:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      if (error.response?.data) {
        throw new BadRequestException(
          error.response.data.message || 'Failed to initialize payment',
        );
      }
      throw new BadRequestException('Failed to initialize payment');
    }
  }

  /**
   * Verify Paystack payment and credit wallet / mark invoice paid.
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

      return this.dataSource.transaction(async (manager) => {
        const payment = await manager.findOne(Payment, {
          where: { paymentGatewayId: reference },
          lock: { mode: 'pessimistic_write' },
        });

        if (!payment) {
          throw new NotFoundException(`Payment with reference ${reference} not found`);
        }

        if (payment.status === 'Succeeded') {
          return payment;
        }

        if (paymentData.status === 'success') {
          const paidAmount = Number(paymentData.amount) / 100;
          payment.status = 'Succeeded';
          payment.processedAt = new Date(paymentData.transaction_date);
          payment.paymentMethod = paymentData.authorization?.card_type || payment.paymentMethod || 'Card';
          payment.amount = paidAmount;
          await manager.save(payment);

          if (!payment.transactionId) {
            await this.walletService.topUp(
              payment.userId,
              paidAmount,
              undefined,
              'Paystack wallet top-up',
              payment.id,
            );
          } else {
            const invoice = await manager.findOne(Invoice, {
              where: { transactionId: payment.transactionId },
            });
            if (invoice && invoice.status !== 'Paid') {
              invoice.status = 'Paid';
              invoice.paidAt = new Date();
              await manager.save(invoice);
            }
          }
        } else {
          payment.status = 'Failed';
          payment.failureReason = paymentData.gateway_response;
          payment.processedAt = new Date(paymentData.transaction_date);
          await manager.save(payment);
        }

        return payment;
      });
    } catch (error: any) {
      this.logger.error('Error verifying Paystack payment:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      if (error.response?.data) {
        throw new BadRequestException(
          error.response.data.message || 'Payment verification failed',
        );
      }
      throw new BadRequestException('Payment verification failed');
    }
  }

  async handlePaystackWebhook(
    signature: string,
    rawBody: Buffer | undefined,
    parsedBody: { event?: string; data?: { reference?: string } },
  ): Promise<{ received: true }> {
    const secret = this.paystackSecretKey;
    if (!secret) {
      throw new UnauthorizedException('Paystack is not configured');
    }

    const payload = rawBody?.length ? rawBody : Buffer.from(JSON.stringify(parsedBody ?? {}));
    const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
    const expected = Buffer.from(hash, 'utf8');
    const received = Buffer.from(signature || '', 'utf8');
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      throw new UnauthorizedException('Invalid Paystack signature');
    }

    if (parsedBody?.event === 'charge.success' && parsedBody.data?.reference) {
      try {
        await this.verifyPayment(parsedBody.data.reference);
      } catch (error) {
        if (error instanceof NotFoundException) {
          this.logger.warn(
            `Paystack webhook for unknown reference ${parsedBody.data.reference}`,
          );
          return { received: true };
        }
        this.logger.error(`Paystack webhook verify failed for ${parsedBody.data.reference}`, error);
        throw error;
      }
    }

    return { received: true };
  }

  /**
   * Process payment for invoice
   */
  async processPaymentForInvoice(
    invoiceId: number,
    email: string,
    channel?: string,
    phone?: string,
    actor?: { id: number; accountType: string },
  ): Promise<{ authorizationUrl: string; reference: string }> {
    const result = await this.initializePayment(invoiceId, email, undefined, channel, phone, actor);
    return {
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
    };
  }

  /**
   * Process payment for transaction
   * Supports mobile money with channel and phone parameters
   */
  async processPaymentForTransaction(
    transactionId: number,
    email: string,
    channel?: string,
    phone?: string,
    actor?: { id: number; accountType: string },
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

    if (transaction.userId) {
      this.assertInvoiceActor(transaction.userId, actor);
    }

    // Generate invoice if not exists
    let invoice = await this.invoiceRepository.findOne({
      where: { transactionId },
    });

    if (!invoice) {
      invoice = await this.billingService.generateInvoice(transactionId);
    }

    return this.processPaymentForInvoice(invoice.id, email, channel, phone, actor);
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
   * Get all payments (Admin/SuperAdmin)
   */
  async getAllPayments(limit: number = 100, offset: number = 0, vendorId?: number) {
    const qb = this.paymentRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.transaction', 'tx')
      .leftJoinAndSelect('p.user', 'user')
      .orderBy('p.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (vendorId != null) {
      qb.innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id').andWhere(
        'cp.vendor_id = :vendorId',
        { vendorId },
      );
    }

    const [payments, total] = await qb.getManyAndCount();
    return { payments, total };
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
}

