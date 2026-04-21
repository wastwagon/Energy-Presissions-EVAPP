import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SystemSetting } from '../entities/system-setting.entity';
import { CmsContent } from '../entities/cms-content.entity';
import { BrandingAsset } from '../entities/branding-asset.entity';
import { StorageModule } from '../storage/storage.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemSetting, CmsContent, BrandingAsset]),
    StorageModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SettingsController],
  providers: [SettingsService, JwtAuthGuard, RolesGuard],
  exports: [SettingsService],
})
export class SettingsModule {}



