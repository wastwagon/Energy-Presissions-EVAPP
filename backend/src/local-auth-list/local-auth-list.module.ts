import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalAuthListService } from './local-auth-list.service';
import { LocalAuthListController } from './local-auth-list.controller';
import { LocalAuthList } from '../entities/local-auth-list.entity';
import { LocalAuthListVersion } from '../entities/local-auth-list-version.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { ChargePointsModule } from '../charge-points/charge-points.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocalAuthList, LocalAuthListVersion, ChargePoint]),
    ChargePointsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [LocalAuthListController],
  providers: [LocalAuthListService, JwtAuthGuard, RolesGuard],
  exports: [LocalAuthListService],
})
export class LocalAuthListModule {}



