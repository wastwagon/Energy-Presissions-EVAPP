import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantsController, TenantPortalController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantStatusService } from './tenant-status.service';
import { Tenant } from '../entities/tenant.entity';
import { TenantDisablement } from '../entities/tenant-disablement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TenantDisablement]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TenantsController, TenantPortalController],
  providers: [TenantsService, TenantStatusService],
  exports: [TenantsService, TenantStatusService],
})
export class TenantsModule {}



