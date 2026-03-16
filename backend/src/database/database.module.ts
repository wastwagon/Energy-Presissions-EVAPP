import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChargePoint } from '../entities/charge-point.entity';
import { Connector } from '../entities/connector.entity';
import { User } from '../entities/user.entity';
import { IdTag } from '../entities/id-tag.entity';
import { Transaction } from '../entities/transaction.entity';
import { MeterSample } from '../entities/meter-sample.entity';
import { Tariff } from '../entities/tariff.entity';
import { Payment } from '../entities/payment.entity';
import { Invoice } from '../entities/invoice.entity';
import { ConfigKey } from '../entities/config-key.entity';
import { Reservation } from '../entities/reservation.entity';
import { LocalAuthList } from '../entities/local-auth-list.entity';
import { LocalAuthListVersion } from '../entities/local-auth-list-version.entity';
import { ChargingProfile } from '../entities/charging-profile.entity';
import { FirmwareJob } from '../entities/firmware-job.entity';
import { DiagnosticsJob } from '../entities/diagnostics-job.entity';
import { Vendor } from '../entities/vendor.entity';
import { VendorDisablement } from '../entities/vendor-disablement.entity';
import { SystemSetting } from '../entities/system-setting.entity';
import { CmsContent } from '../entities/cms-content.entity';
import { BrandingAsset } from '../entities/branding-asset.entity';
import { ConnectionLog } from '../entities/connection-log.entity';
import { ConnectionStatistics } from '../entities/connection-statistics.entity';
import { WalletTransaction } from '../entities/wallet-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [
          ChargePoint,
          Connector,
          User,
          IdTag,
          Transaction,
          MeterSample,
          Tariff,
          Payment,
          Invoice,
          ConfigKey,
          Reservation,
          LocalAuthList,
          LocalAuthListVersion,
          ChargingProfile,
          FirmwareJob,
          DiagnosticsJob,
          Vendor,
          VendorDisablement,
          SystemSetting,
          CmsContent,
          BrandingAsset,
          ConnectionLog,
          ConnectionStatistics,
          WalletTransaction,
        ],
        synchronize: false, // Disabled - using SQL initialization scripts
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

