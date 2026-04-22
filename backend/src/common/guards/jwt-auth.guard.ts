import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { resolveJwtSecret } from '../utils/jwt-secret';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = resolveJwtSecret(this.configService);

    try {
      const payload = this.jwtService.verify(token, { secret });
      
      // Attach user info to request
      request.user = {
        id: payload.sub,
        email: payload.email,
        accountType: payload.accountType,
        vendorId: payload.vendorId || payload.tenantId, // Support both for backward compatibility
      };
      
      return true;
    } catch (error: any) {
      // Provide more detailed error message for debugging
      const errorMessage = error.message || 'Invalid or expired token';
      throw new UnauthorizedException(`JWT validation failed: ${errorMessage}`);
    }
  }
}



