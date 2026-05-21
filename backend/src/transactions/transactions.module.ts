import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { resolveJwtSecret } from '../common/utils/jwt-secret';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from '../entities/transaction.entity';
import { MeterSample } from '../entities/meter-sample.entity';
import { Connector } from '../entities/connector.entity';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { User } from '../entities/user.entity';
import { BrandingAsset } from '../entities/branding-asset.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      MeterSample,
      Connector,
      WalletTransaction,
      ChargePoint,
      User,
      BrandingAsset,
    ]),
    WalletModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: resolveJwtSecret(configService),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}

