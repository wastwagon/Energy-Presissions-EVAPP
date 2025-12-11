import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Service token required');
    }

    const token = authHeader.replace('Bearer ', '');
    const expectedToken = this.configService.get<string>('SERVICE_TOKEN');

    if (token !== expectedToken) {
      throw new UnauthorizedException('Invalid service token');
    }

    return true;
  }
}



