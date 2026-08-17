import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VendorsController, VendorPortalController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { VendorStatusService } from './vendor-status.service';
import { VendorPayoutsService } from './vendor-payouts.service';
import { Vendor } from '../entities/vendor.entity';
import { VendorDisablement } from '../entities/vendor-disablement.entity';
import { VendorPayout } from '../entities/vendor-payout.entity';
import { User } from '../entities/user.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { Transaction } from '../entities/transaction.entity';
import { StorageModule } from '../storage/storage.module';
import { resolveJwtSecret } from '../common/utils/jwt-secret';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor, VendorDisablement, VendorPayout, User, ChargePoint, Transaction]),
    StorageModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: resolveJwtSecret(configService),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [VendorsController, VendorPortalController],
  providers: [VendorsService, VendorStatusService, VendorPayoutsService],
  exports: [VendorsService, VendorStatusService],
})
export class VendorsModule {}

