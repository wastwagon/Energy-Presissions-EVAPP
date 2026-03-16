import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class LoginDto {
  @IsEmail()
  email: string;

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

  @IsOptional()
  @IsString()
  phone?: string;
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
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
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

