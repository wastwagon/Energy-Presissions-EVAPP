import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantStatusService } from './tenant-status.service';
import { Tenant } from '../entities/tenant.entity';
import { TenantDisablement } from '../entities/tenant-disablement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, TenantDisablement])],
  controllers: [TenantsController],
  providers: [TenantsService, TenantStatusService],
  exports: [TenantsService, TenantStatusService],
})
export class TenantsModule {}



