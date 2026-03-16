import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SelfOrAdminGuard } from '../common/guards/self-or-admin.guard';

@ApiTags('Payment Methods')
@Controller('payment-methods')
@UseGuards(JwtAuthGuard)
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}

  @Get('user/:userId')
  @UseGuards(SelfOrAdminGuard)
  @ApiOperation({ summary: 'Get user payment methods' })
  async findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.findByUser(userId);
  }

  @Post('user/:userId')
  @UseGuards(SelfOrAdminGuard)
  @ApiOperation({ summary: 'Add payment method' })
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { type: string; provider?: string; lastFour?: string; phone?: string; isDefault?: boolean },
  ) {
    return this.service.create(userId, body);
  }

  @Post('user/:userId/:id/default')
  @UseGuards(SelfOrAdminGuard)
  @ApiOperation({ summary: 'Set default payment method' })
  async setDefault(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.setDefault(userId, id);
  }

  @Delete('user/:userId/:id')
  @UseGuards(SelfOrAdminGuard)
  @ApiOperation({ summary: 'Delete payment method' })
  async delete(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.delete(userId, id);
  }
}
