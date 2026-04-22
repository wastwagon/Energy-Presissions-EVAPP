import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';
import { ChargePoint } from '../entities/charge-point.entity';
import { Connector } from '../entities/connector.entity';
import { Transaction } from '../entities/transaction.entity';
import { MeterSample } from '../entities/meter-sample.entity';
import { IdTag } from '../entities/id-tag.entity';
import { PendingCommand } from '../entities/pending-command.entity';
import { BillingModule } from '../billing/billing.module';
import { CommandQueueService } from '../services/command-queue.service';
import { ChargePointsModule } from '../charge-points/charge-points.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { LocalAuthListModule } from '../local-auth-list/local-auth-list.module';
import { VendorsModule } from '../vendors/vendors.module';
import { ConnectionLogsModule } from '../connection-logs/connection-logs.module';
import { WalletModule } from '../wallet/wallet.module';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { User } from '../entities/user.entity';
import { BlockedChargePointId } from '../entities/blocked-charge-point-id.entity';
import { ServiceTokenGuard } from '../common/guards/service-token.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChargePoint,
      Connector,
      Transaction,
      MeterSample,
      IdTag,
      PendingCommand,
      WalletTransaction,
      User,
      BlockedChargePointId,
    ]),
    BillingModule,
    forwardRef(() => ChargePointsModule),
    ReservationsModule,
    LocalAuthListModule,
    VendorsModule,
    ConnectionLogsModule,
    WalletModule,
  ],
  controllers: [InternalController],
  providers: [InternalService, CommandQueueService, ServiceTokenGuard],
  exports: [InternalService],
})
export class InternalModule {}

