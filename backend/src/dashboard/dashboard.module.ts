import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../entities/user.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { Transaction } from '../entities/transaction.entity';
import { Vendor } from '../entities/vendor.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { ConnectionStatistics } from '../entities/connection-statistics.entity';
import { Connector } from '../entities/connector.entity';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { resolveJwtSecret } from '../common/utils/jwt-secret';
import { WalletModule } from '../wallet/wallet.module';
import { ChargePointsModule } from '../charge-points/charge-points.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [
    WalletModule,
    ChargePointsModule,
    TypeOrmModule.forFeature([
      User,
      ChargePoint,
      Transaction,
      Vendor,
      Invoice,
      Payment,
      ConnectionStatistics,
      Connector,
      WalletTransaction,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: resolveJwtSecret(configService),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DashboardController],
  providers: [DashboardService, JwtAuthGuard, RolesGuard],
  exports: [DashboardService],
})
export class DashboardModule {}

