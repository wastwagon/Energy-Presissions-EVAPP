import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;
    const serviceHeader = request.headers['x-service-token'] as string | undefined;

    const bearer = authHeader?.replace(/^Bearer\s+/i, '').trim();
    const token = bearer || (typeof serviceHeader === 'string' ? serviceHeader.trim() : '');

    if (!token) {
      throw new UnauthorizedException('Service token required');
    }

    const expectedToken = this.configService.get<string>('SERVICE_TOKEN');
    if (!expectedToken) {
      throw new UnauthorizedException('Service token is not configured');
    }

    if (token !== expectedToken) {
      throw new UnauthorizedException('Invalid service token');
    }

    return true;
  }
}



