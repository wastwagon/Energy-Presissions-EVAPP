import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VendorsController, VendorPortalController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { VendorStatusService } from './vendor-status.service';
import { Vendor } from '../entities/vendor.entity';
import { VendorDisablement } from '../entities/vendor-disablement.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor, VendorDisablement]),
    StorageModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [VendorsController, VendorPortalController],
  providers: [VendorsService, VendorStatusService],
  exports: [VendorsService, VendorStatusService],
})
export class VendorsModule {}

