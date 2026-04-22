import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../entities/user.entity';
import { IdTag } from '../entities/id-tag.entity';
import { UserFavorite } from '../entities/user-favorite.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SelfOrAdminGuard } from '../common/guards/self-or-admin.guard';
import { resolveJwtSecret } from '../common/utils/jwt-secret';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, IdTag, UserFavorite, ChargePoint]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: resolveJwtSecret(configService),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtAuthGuard, RolesGuard, SelfOrAdminGuard],
  exports: [UsersService],
})
export class UsersModule {}

