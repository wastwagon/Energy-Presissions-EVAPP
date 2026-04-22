import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { User } from '../entities/user.entity';
import { Payment } from '../entities/payment.entity';
import { Invoice } from '../entities/invoice.entity';
import { Transaction } from '../entities/transaction.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { resolveJwtSecret } from '../common/utils/jwt-secret';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletTransaction,
      User,
      Payment,
      Invoice,
      Transaction,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: resolveJwtSecret(config),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WalletController],
  providers: [WalletService, JwtAuthGuard, RolesGuard],
  exports: [WalletService],
})
export class WalletModule {}



