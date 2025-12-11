import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalAuthListService } from './local-auth-list.service';
import { LocalAuthListController } from './local-auth-list.controller';
import { LocalAuthList } from '../entities/local-auth-list.entity';
import { LocalAuthListVersion } from '../entities/local-auth-list-version.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { ChargePointsModule } from '../charge-points/charge-points.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocalAuthList, LocalAuthListVersion, ChargePoint]),
    ChargePointsModule,
  ],
  controllers: [LocalAuthListController],
  providers: [LocalAuthListService],
  exports: [LocalAuthListService],
})
export class LocalAuthListModule {}



