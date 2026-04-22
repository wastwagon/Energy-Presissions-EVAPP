import { ConfigService } from '@nestjs/config';

const DEV_FALLBACK = 'your-secret-key-change-in-production';

/**
 * Single source for JWT signing/verification secret.
 * Production must set JWT_SECRET; development may omit it (fallback).
 */
export function resolveJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET')?.trim();
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set when NODE_ENV is production');
  }
  return DEV_FALLBACK;
}
