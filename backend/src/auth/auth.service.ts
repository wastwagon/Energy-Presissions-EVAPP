import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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

