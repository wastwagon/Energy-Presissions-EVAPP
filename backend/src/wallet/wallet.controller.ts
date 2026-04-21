import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class TopUpDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  adminNote?: string;
}

class AdjustDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  adminNote?: string;
}

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  private assertWalletReadAccess(
    user: { id: number; accountType: string },
    targetUserId: number,
  ): void {
    if (user.accountType === 'SuperAdmin' || user.accountType === 'Admin') {
      return;
    }
    if (user.accountType === 'Customer' && user.id === targetUserId) {
      return;
    }
    throw new ForbiddenException('You cannot access this wallet');
  }

  @Get('balance/:userId')
  @ApiOperation({ summary: 'Get user wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet balance' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getBalance(
    @Request() req: { user: { id: number; accountType: string } },
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    this.assertWalletReadAccess(req.user, userId);
    return this.walletService.getBalance(userId);
  }

  @Get('available-balance/:userId')
  @ApiOperation({ summary: 'Get available wallet balance (excluding pending reservations)' })
  @ApiResponse({ status: 200, description: 'Available balance details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getAvailableBalance(
    @Request() req: { user: { id: number; accountType: string } },
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    this.assertWalletReadAccess(req.user, userId);
    return this.walletService.getAvailableBalance(userId);
  }

  @Post('top-up')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'Admin')
  @ApiOperation({ summary: 'Top up user wallet (Admin)' })
  @ApiResponse({ status: 201, description: 'Wallet topped up successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async topUp(
    @Request() req: { user: { id: number; accountType: string } },
    @Body() dto: TopUpDto,
  ) {
    const adminId = req.user.id;
    return this.walletService.topUp(
      dto.userId,
      dto.amount,
      adminId,
      dto.adminNote,
    );
  }

  @Post('adjust')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'Admin')
  @ApiOperation({ summary: 'Adjust user wallet balance (Admin)' })
  @ApiResponse({ status: 201, description: 'Wallet adjusted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async adjust(
    @Request() req: { user: { id: number; accountType: string } },
    @Body() dto: AdjustDto,
  ) {
    const adminId = req.user.id;
    return this.walletService.adjust(dto.userId, dto.amount, adminId, dto.adminNote || 'Balance adjustment');
  }

  @Get('transactions/:userId')
  @ApiOperation({ summary: 'Get wallet transactions for user' })
  @ApiResponse({ status: 200, description: 'List of wallet transactions' })
  async getTransactions(
    @Request() req: { user: { id: number; accountType: string } },
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    this.assertWalletReadAccess(req.user, userId);
    return this.walletService.getTransactions(
      userId,
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0,
    );
  }

  @Get('transactions/detail/:id')
  @ApiOperation({ summary: 'Get wallet transaction by ID' })
  @ApiResponse({ status: 200, description: 'Wallet transaction details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransaction(
    @Request() req: { user: { id: number; accountType: string } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const row = await this.walletService.getTransaction(id);
    this.assertWalletReadAccess(req.user, row.userId);
    return row;
  }
}



