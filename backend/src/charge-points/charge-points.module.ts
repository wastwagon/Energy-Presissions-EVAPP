import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ChargePointsService } from './charge-points.service';
import { ChargePointsController } from './charge-points.controller';
import { ChargePoint } from '../entities/charge-point.entity';
import { BlockedChargePointId } from '../entities/blocked-charge-point-id.entity';
import { Connector } from '../entities/connector.entity';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChargePoint, Connector, Transaction, User, BlockedChargePointId]),
    ConfigModule,
    WalletModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChargePointsController],
  providers: [ChargePointsService, JwtAuthGuard, RolesGuard],
  exports: [ChargePointsService],
})
export class ChargePointsModule {}
