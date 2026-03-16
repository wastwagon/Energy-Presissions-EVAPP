import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentMethod } from '../entities/payment-method.entity';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsService } from './payment-methods.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SelfOrAdminGuard } from '../common/guards/self-or-admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentMethod]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PaymentMethodsController],
  providers: [PaymentMethodsService, JwtAuthGuard, SelfOrAdminGuard],
  exports: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
