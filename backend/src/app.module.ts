import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChargePointsModule } from './charge-points/charge-points.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BillingModule } from './billing/billing.module';
import { InternalModule } from './internal/internal.module';
import { PaymentsModule } from './payments/payments.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { AuditModule } from './audit/audit.module';
import { WalletModule } from './wallet/wallet.module';
import { ReservationsModule } from './reservations/reservations.module';
import { LocalAuthListModule } from './local-auth-list/local-auth-list.module';
import { SmartChargingModule } from './smart-charging/smart-charging.module';
import { FirmwareModule } from './firmware/firmware.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { WebSocketGateway } from './websocket/websocket.gateway';
import { VendorsModule } from './vendors/vendors.module';
import { SettingsModule } from './settings/settings.module';
import { TariffsModule } from './tariffs/tariffs.module';
import { ConnectionLogsModule } from './connection-logs/connection-logs.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { StationsModule } from './stations/stations.module';
import { UtilsModule } from './utils/utils.module';
import { SeedService } from './database/seed.service';
import { User } from './entities/user.entity';
import { Vendor } from './entities/vendor.entity';
import { InternalService } from './internal/internal.service';
import { ChargePointsService } from './charge-points/charge-points.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Root `.env` (docker-compose / monorepo) and `backend/.env` (local nest start from ./backend)
      envFilePath: ['.env', '../.env'],
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([User, Vendor]), // For seed service
    AuthModule,
    UsersModule,
    ChargePointsModule,
    TransactionsModule,
    BillingModule,
    PaymentsModule,
    PaymentMethodsModule,
    AuditModule,
    WalletModule,
    ReservationsModule,
    LocalAuthListModule,
    SmartChargingModule,
    FirmwareModule,
    DiagnosticsModule,
    VendorsModule,
    SettingsModule,
    TariffsModule,
    ConnectionLogsModule,
    DashboardModule,
    StationsModule,
    UtilsModule,
    InternalModule,
  ],
  controllers: [AppController],
  providers: [AppService, WebSocketGateway, SeedService],
  exports: [WebSocketGateway],
})
export class AppModule implements OnModuleInit {
  constructor(
    private internalService: InternalService,
    private chargePointsService: ChargePointsService,
  ) {}

  onModuleInit() {
    // Inject ChargePointsService into InternalService to avoid circular dependency
    this.internalService.setChargePointsService(this.chargePointsService);
  }
}

