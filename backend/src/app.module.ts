import { Module } from '@nestjs/common';
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
import { WalletModule } from './wallet/wallet.module';
import { ReservationsModule } from './reservations/reservations.module';
import { LocalAuthListModule } from './local-auth-list/local-auth-list.module';
import { SmartChargingModule } from './smart-charging/smart-charging.module';
import { FirmwareModule } from './firmware/firmware.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { WebSocketGateway } from './websocket/websocket.gateway';
import { TenantsModule } from './tenants/tenants.module';
import { SettingsModule } from './settings/settings.module';
import { TariffsModule } from './tariffs/tariffs.module';
import { ConnectionLogsModule } from './connection-logs/connection-logs.module';
import { SeedService } from './database/seed.service';
import { User } from './entities/user.entity';
import { Tenant } from './entities/tenant.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([User, Tenant]), // For seed service
    AuthModule,
    UsersModule,
    ChargePointsModule,
    TransactionsModule,
    BillingModule,
    PaymentsModule,
    WalletModule,
    ReservationsModule,
    LocalAuthListModule,
    SmartChargingModule,
    FirmwareModule,
    DiagnosticsModule,
    TenantsModule,
    SettingsModule,
    TariffsModule,
    ConnectionLogsModule,
    InternalModule,
  ],
  controllers: [AppController],
  providers: [AppService, WebSocketGateway, SeedService],
  exports: [WebSocketGateway],
})
export class AppModule {}

