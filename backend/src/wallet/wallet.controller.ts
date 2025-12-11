import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { WalletTransactionType } from '../entities/wallet-transaction.entity';

class TopUpDto {
  userId: number;
  amount: number;
  adminNote?: string;
}

class AdjustDto {
  userId: number;
  amount: number;
  adminNote: string;
}

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance/:userId')
  @ApiOperation({ summary: 'Get user wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet balance' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getBalance(@Param('userId', ParseIntPipe) userId: number) {
    return this.walletService.getBalance(userId);
  }

  @Post('top-up')
  @ApiOperation({ summary: 'Top up user wallet (Admin)' })
  @ApiResponse({ status: 201, description: 'Wallet topped up successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async topUp(@Body() dto: TopUpDto) {
    // TODO: Add admin guard and get adminId from request
    const adminId = 1; // Placeholder
    return this.walletService.topUp(
      dto.userId,
      dto.amount,
      adminId,
      dto.adminNote,
    );
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Adjust user wallet balance (Admin)' })
  @ApiResponse({ status: 201, description: 'Wallet adjusted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async adjust(@Body() dto: AdjustDto) {
    // TODO: Add admin guard and get adminId from request
    const adminId = 1; // Placeholder
    return this.walletService.adjust(dto.userId, dto.amount, adminId, dto.adminNote);
  }

  @Get('transactions/:userId')
  @ApiOperation({ summary: 'Get wallet transactions for user' })
  @ApiResponse({ status: 200, description: 'List of wallet transactions' })
  async getTransactions(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
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
  async getTransaction(@Param('id', ParseIntPipe) id: number) {
    return this.walletService.getTransaction(id);
  }
}



