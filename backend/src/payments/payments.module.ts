import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from '../entities/payment.entity';
import { Invoice } from '../entities/invoice.entity';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { BillingModule } from '../billing/billing.module';
import { WalletModule } from '../wallet/wallet.module';
import { VendorsModule } from '../vendors/vendors.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { resolveJwtSecret } from '../common/utils/jwt-secret';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Invoice, Transaction, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: resolveJwtSecret(configService),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    BillingModule,
    forwardRef(() => WalletModule),
    VendorsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, JwtAuthGuard, RolesGuard],
  exports: [PaymentsService],
})
export class PaymentsModule {}

