import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';

class LoginDto {
  /** Preferred: email or phone. Legacy: `email` only (shell scripts / older clients). */
  @IsOptional()
  @IsString()
  emailOrPhone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class AppleSignInDto {
  @IsString()
  id_token: string;

  @IsOptional()
  user?: { name?: { firstName?: string; lastName?: string }; email?: string };
}

class GoogleSignInDto {
  @IsString()
  credential: string;
}

class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  phone: string;
}

class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with Apple' })
  @ApiResponse({ status: 200, description: 'Apple sign in successful' })
  @ApiResponse({ status: 401, description: 'Invalid Apple token' })
  async appleSignIn(@Body() dto: AppleSignInDto) {
    return this.authService.appleSignIn(dto.id_token, dto.user);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with Google' })
  @ApiResponse({ status: 200, description: 'Google sign in successful' })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  async googleSignIn(@Body() dto: GoogleSignInDto) {
    return this.authService.googleSignIn(dto.credential);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const id = (loginDto.emailOrPhone ?? loginDto.email)?.trim();
    if (!id || id.length < 3) {
      throw new BadRequestException('Email or phone number is required');
    }
    return this.authService.login(id, loginDto.password);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Creates a reset token for the account (non-production: token is logged server-side). Configure email delivery for production.',
  })
  @ApiResponse({ status: 200, description: 'Acknowledged (same message whether or not the email exists)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete password reset with email and token' })
  @ApiResponse({ status: 200, description: 'Password updated' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.token, dto.password);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user info' })
  async getCurrentUser(@Request() req: any) {
    // This will be protected by JWT guard
    return req.user;
  }
}

