import { Injectable, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';
import { normalizePhone } from '../common/phone.util';

const APPLE_CLIENT_ID = 'com.energyprecisions.cleanmotion.signin';

export type AuthUserPayload = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  accountType: string;
  vendorId: number;
  phone?: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /** New customers (register / social) when no vendor is specified; set DEFAULT_CUSTOMER_VENDOR_ID in production. */
  private getDefaultCustomerVendorId(): number {
    const raw = this.configService.get<string>('DEFAULT_CUSTOMER_VENDOR_ID');
    if (raw != null && String(raw).trim() !== '') {
      const n = parseInt(String(raw).trim(), 10);
      if (Number.isFinite(n) && n > 0) {
        return n;
      }
    }
    return 1;
  }

  private toAuthUserPayload(user: User): AuthUserPayload {
    const payload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      accountType: user.accountType,
      vendorId: user.vendorId,
    };
    if (user.phone) {
      payload.phone = user.phone;
    }
    return payload;
  }

  private safeEqualToken(a: string, b: string | null | undefined): boolean {
    if (!b || a.length !== b.length) {
      return false;
    }
    try {
      return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
    } catch {
      return false;
    }
  }

  async validateUserByIdentifier(identifier: string, password: string): Promise<User | null> {
    const trimmed = identifier.trim();
    if (!trimmed) {
      return null;
    }

    let user: User | null = null;
    if (trimmed.includes('@')) {
      user = await this.usersService.findByEmail(trimmed.toLowerCase());
    } else {
      const normalized = normalizePhone(trimmed);
      if (normalized.length < 8) {
        return null;
      }
      user = await this.usersService.findByPhone(normalized);
    }

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    if (user.status !== 'Active') {
      throw new UnauthorizedException('User account is not active');
    }

    return user;
  }

  async login(emailOrPhone: string, password: string): Promise<{
    accessToken: string;
    user: AuthUserPayload;
  }> {
    const user = await this.validateUserByIdentifier(emailOrPhone, password);

    if (!user) {
      throw new UnauthorizedException('Invalid email, phone number, or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      accountType: user.accountType,
      vendorId: user.vendorId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: this.toAuthUserPayload(user),
    };
  }

  async appleSignIn(
    idToken: string,
    userInfo?: { name?: { firstName?: string; lastName?: string }; email?: string },
  ): Promise<{
    accessToken: string;
    user: AuthUserPayload;
  }> {
    let payload: { sub: string; email?: string };
    try {
      const client = jwksClient({
        jwksUri: 'https://appleid.apple.com/auth/keys',
        timeout: 30000,
      });
      const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
        if (!header.kid) return callback(new Error('Missing kid in token header'), undefined);
        client.getSigningKey(header.kid).then((key) => {
          const pubKey = key?.getPublicKey();
          callback(null, pubKey);
        }).catch((err) => callback(err, undefined));
      };
      const decoded = await new Promise<jwt.JwtPayload & { sub: string; email?: string }>((resolve, reject) => {
        jwt.verify(idToken, getKey, {
          algorithms: ['RS256'],
          issuer: 'https://appleid.apple.com',
          audience: APPLE_CLIENT_ID,
        }, (err, decoded) => {
          if (err) reject(err);
          else resolve(decoded as jwt.JwtPayload & { sub: string; email?: string });
        });
      });
      payload = { sub: decoded.sub, email: decoded.email };
    } catch (err) {
      this.logger.warn('Apple token verification failed', err);
      throw new UnauthorizedException('Invalid Apple Sign In token');
    }
    const email = payload.email || userInfo?.email;
    if (!email) {
      throw new UnauthorizedException('Email not provided by Apple. Please use email/password sign in.');
    }
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      const firstName = userInfo?.name?.firstName || '';
      const lastName = userInfo?.name?.lastName || '';
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await this.usersService.create({
        email,
        passwordHash: randomPassword,
        firstName,
        lastName,
        accountType: 'Customer',
        vendorId: this.getDefaultCustomerVendorId(),
        balance: 0,
        currency: 'GHS',
        status: 'Active',
        emailVerified: true,
      });
    }
    if (user.status !== 'Active') {
      throw new UnauthorizedException('User account is not active');
    }
    const tokenPayload = { sub: user.id, email: user.email, accountType: user.accountType, vendorId: user.vendorId };
    return {
      accessToken: this.jwtService.sign(tokenPayload),
      user: this.toAuthUserPayload(user),
    };
  }

  async googleSignIn(idToken: string): Promise<{
    accessToken: string;
    user: AuthUserPayload;
  }> {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      this.logger.warn('GOOGLE_CLIENT_ID not configured');
      throw new UnauthorizedException('Google Sign-In is not configured');
    }
    const client = new OAuth2Client(googleClientId);
    let payload: { sub: string; email?: string; given_name?: string; family_name?: string };
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      payload = ticket.getPayload() as { sub: string; email?: string; given_name?: string; family_name?: string };
    } catch (err) {
      this.logger.warn('Google token verification failed', err);
      throw new UnauthorizedException('Invalid Google Sign-In token');
    }
    const email = payload.email;
    if (!email) {
      throw new UnauthorizedException('Email not provided by Google. Please use email/password sign in.');
    }
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      const firstName = payload.given_name || '';
      const lastName = payload.family_name || '';
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await this.usersService.create({
        email,
        passwordHash: randomPassword,
        firstName,
        lastName,
        accountType: 'Customer',
        vendorId: this.getDefaultCustomerVendorId(),
        balance: 0,
        currency: 'GHS',
        status: 'Active',
        emailVerified: true,
      });
    }
    if (user.status !== 'Active') {
      throw new UnauthorizedException('User account is not active');
    }
    const tokenPayload = { sub: user.id, email: user.email, accountType: user.accountType, vendorId: user.vendorId };
    return {
      accessToken: this.jwtService.sign(tokenPayload),
      user: this.toAuthUserPayload(user),
    };
  }

  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone: string;
    vendorId?: number;
  }): Promise<User> {
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    const normalizedPhone = normalizePhone(data.phone);
    if (normalizedPhone.length < 8) {
      throw new BadRequestException('Please enter a valid phone number');
    }
    const existingPhone = await this.usersService.findByPhone(normalizedPhone);
    if (existingPhone) {
      throw new UnauthorizedException('User with this phone number already exists');
    }

    return this.usersService.create({
      email: data.email,
      passwordHash: data.password, // Will be hashed in service
      firstName: data.firstName,
      lastName: data.lastName,
      phone: normalizedPhone,
      accountType: 'Customer',
      vendorId: data.vendorId ?? this.getDefaultCustomerVendorId(),
      balance: 0,
      currency: 'GHS',
      status: 'Active',
      emailVerified: false,
    });
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const normalized = email.trim().toLowerCase();
    const generic: { message: string } = {
      message:
        'If that email is registered, use the next step to choose a new password. Contact us if you get stuck.',
    };

    const user = await this.usersService.findByEmail(normalized);
    if (!user || user.status !== 'Active') {
      return generic;
    }

    const token = crypto.randomBytes(32).toString('hex');
    await this.usersService.update(user.id, {
      passwordResetToken: token,
      passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[dev] Password reset token for ${normalized}: ${token}`);
    }

    return generic;
  }

  async resetPassword(email: string, token: string, password: string): Promise<{ message: string }> {
    const normalized = email.trim().toLowerCase();
    const user = await this.usersService.findByEmailWithPasswordReset(normalized);
    if (!user?.passwordResetToken || !user.passwordResetExpiresAt) {
      throw new BadRequestException("That code doesn't match. Try again or request a new reset.");
    }
    if (new Date() > new Date(user.passwordResetExpiresAt)) {
      throw new BadRequestException('That code has expired. Start over with a new reset.');
    }
    if (!this.safeEqualToken(token.trim(), user.passwordResetToken)) {
      throw new BadRequestException("That code doesn't match. Check it and try again.");
    }

    await this.usersService.setPasswordAndClearResetToken(user.id, password);

    return { message: 'Your password is updated. You can sign in now.' };
  }
}

