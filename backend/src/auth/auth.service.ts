import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';

const APPLE_CLIENT_ID = 'com.energyprecisions.cleanmotion.signin';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    // Check if password matches
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    // Check if user is active
    if (user.status !== 'Active') {
      throw new UnauthorizedException('User account is not active');
    }

    return user;
  }

  async login(email: string, password: string): Promise<{
    accessToken: string;
    user: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      accountType: string;
      vendorId: number;
    };
  }> {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      accountType: user.accountType,
      vendorId: user.vendorId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountType: user.accountType,
        vendorId: user.vendorId,
      },
    };
  }

  async appleSignIn(
    idToken: string,
    userInfo?: { name?: { firstName?: string; lastName?: string }; email?: string },
  ): Promise<{
    accessToken: string;
    user: { id: number; email: string; firstName: string; lastName: string; accountType: string; vendorId: number };
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
        vendorId: 1,
        balance: 0,
        currency: 'GHS',
        status: 'Active',
        emailVerified: true,
      });
    }
    if (user.status !== 'Active') {
      throw new UnauthorizedException('User account is not active');
    }
    if (user.accountType !== 'Customer') {
      throw new UnauthorizedException('Sign in with Apple is for customers only. Please use the admin login.');
    }
    const tokenPayload = { sub: user.id, email: user.email, accountType: user.accountType, vendorId: user.vendorId };
    return {
      accessToken: this.jwtService.sign(tokenPayload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountType: user.accountType,
        vendorId: user.vendorId,
      },
    };
  }

  async googleSignIn(idToken: string): Promise<{
    accessToken: string;
    user: { id: number; email: string; firstName: string; lastName: string; accountType: string; vendorId: number };
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
        vendorId: 1,
        balance: 0,
        currency: 'GHS',
        status: 'Active',
        emailVerified: true,
      });
    }
    if (user.status !== 'Active') {
      throw new UnauthorizedException('User account is not active');
    }
    if (user.accountType !== 'Customer') {
      throw new UnauthorizedException('Sign in with Google is for customers only. Please use the admin login.');
    }
    const tokenPayload = { sub: user.id, email: user.email, accountType: user.accountType, vendorId: user.vendorId };
    return {
      accessToken: this.jwtService.sign(tokenPayload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountType: user.accountType,
        vendorId: user.vendorId,
      },
    };
  }

  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    vendorId?: number;
  }): Promise<User> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    return this.usersService.create({
      email: data.email,
      passwordHash: data.password, // Will be hashed in service
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      accountType: 'Customer',
      vendorId: data.vendorId || 1,
      balance: 0,
      currency: 'GHS',
      status: 'Active',
      emailVerified: false,
    });
  }
}

