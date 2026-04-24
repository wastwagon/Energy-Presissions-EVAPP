import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { Transaction } from '../entities/transaction.entity';
import { Tariff } from '../entities/tariff.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { Vendor } from '../entities/vendor.entity';
import { SystemSetting } from '../entities/system-setting.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { resolveJwtSecret } from '../common/utils/jwt-secret';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Tariff, Invoice, Payment, Vendor, SystemSetting]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: resolveJwtSecret(config),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [BillingController],
  providers: [BillingService, JwtAuthGuard, RolesGuard],
  exports: [BillingService],
})
export class BillingModule {}

