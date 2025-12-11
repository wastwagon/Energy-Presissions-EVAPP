import { Controller, Get, Post, Body, Param, OnModuleInit } from '@nestjs/common';
import { InternalService } from './internal.service';
import { CommandQueueService } from '../services/command-queue.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Controller('internal')
export class InternalController implements OnModuleInit {
  constructor(
    private readonly internalService: InternalService,
    private readonly commandQueueService: CommandQueueService,
  ) {}

  onModuleInit() {
    // Set command queue service and WebSocket gateway to avoid circular dependencies
    this.internalService.setCommandQueueService(this.commandQueueService);
    this.internalService.setWebSocketGateway(WebSocketGateway.instance);
  }

  @Post('charge-points')
  async upsertChargePoint(@Body() data: any) {
    return this.internalService.upsertChargePoint(data);
  }

  @Post('charge-points/:id/status')
  async updateChargePointStatus(@Param('id') id: string, @Body() data: any) {
    return this.internalService.updateChargePointStatus(id, data);
  }

  @Get('charge-points/:id/status')
  async getChargePointStatus(@Param('id') id: string) {
    return this.internalService.getChargePointStatus(id);
  }

  @Get('charge-points/:id/tenant')
  async getChargePointTenant(@Param('id') id: string) {
    return this.internalService.getChargePointTenant(id);
  }

  @Get('tenants/:id/status')
  async getTenantStatus(@Param('id') id: string) {
    return this.internalService.getTenantStatus(parseInt(id));
  }

  @Post('transactions')
  async createTransaction(@Body() data: any) {
    return this.internalService.createTransaction(data);
  }

  @Post('transactions/:id/stop')
  async stopTransaction(@Param('id') id: string, @Body() data: any) {
    return this.internalService.stopTransaction(parseInt(id), data);
  }

  @Post('meter-values')
  async storeMeterValues(@Body() data: any) {
    return this.internalService.storeMeterValues(data);
  }

  @Post('reservations')
  async createReservation(@Body() data: any) {
    return this.internalService.createReservation(data);
  }

  @Post('reservations/:id/cancel')
  async cancelReservation(@Param('id') id: string, @Body() data: { chargePointId: string; reservationId: number }) {
    return this.internalService.cancelReservation(data.chargePointId, data.reservationId);
  }

  @Get('local-auth-list/:chargePointId/version')
  async getLocalListVersion(@Param('chargePointId') chargePointId: string) {
    return this.internalService.getLocalListVersion(chargePointId);
  }

  @Post('local-auth-list')
  async sendLocalList(@Body() data: any) {
    return this.internalService.sendLocalList(data);
  }

  @Post('data-transfer')
  async handleDataTransfer(@Body() data: any) {
    return this.internalService.handleDataTransfer(data);
  }

  @Post('connection-logs')
  async logConnectionEvent(@Body() data: any) {
    return this.internalService.logConnectionEvent(data);
  }
}
