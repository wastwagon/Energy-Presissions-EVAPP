import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiQuery, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ChargePointsService } from './charge-points.service';
import { ChargePoint } from '../entities/charge-point.entity';

@ApiTags('Charge Points')
@Controller('charge-points')
export class ChargePointsController {
  constructor(private readonly chargePointsService: ChargePointsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all charge points' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by chargePointId, vendor, model, or serialNumber' })
  @ApiQuery({ name: 'vendorId', required: false, type: Number, description: 'Filter by vendor ID' })
  @ApiHeader({ name: 'X-Vendor-Id', required: false, description: 'Vendor ID for filtering (alternative to query param)' })
  @ApiResponse({ status: 200, description: 'List of charge points' })
  async findAll(
    @Query('search') search?: string,
    @Query('vendorId') vendorId?: number,
    @Headers('x-vendor-id') vendorIdHeader?: string,
  ): Promise<ChargePoint[]> {
    // Use query param vendorId or header X-Vendor-Id
    const finalVendorId = vendorId || (vendorIdHeader ? parseInt(vendorIdHeader) : undefined);
    
    return this.chargePointsService.findAll(search, finalVendorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get charge point by ID' })
  @ApiResponse({ status: 200, description: 'Charge point details' })
  @ApiResponse({ status: 404, description: 'Charge point not found' })
  async findOne(@Param('id') id: string): Promise<ChargePoint> {
    return this.chargePointsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new charge point' })
  @ApiResponse({ status: 201, description: 'Charge point created' })
  async create(@Body() data: Partial<ChargePoint>): Promise<ChargePoint> {
    return this.chargePointsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update charge point' })
  @ApiResponse({ status: 200, description: 'Charge point updated' })
  @ApiResponse({ status: 404, description: 'Charge point not found' })
  async update(
    @Param('id') id: string,
    @Body() data: Partial<ChargePoint>,
  ): Promise<ChargePoint> {
    return this.chargePointsService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Admin')
  @ApiOperation({ summary: 'Delete charge point (removes related billing/connector data)' })
  @ApiResponse({ status: 204, description: 'Charge point deleted' })
  @ApiResponse({ status: 404, description: 'Charge point not found' })
  @ApiResponse({ status: 403, description: 'Admin may only delete devices for their vendor' })
  async delete(
    @Param('id') id: string,
    @Request() req: { user: { accountType: string; vendorId?: number } },
  ): Promise<void> {
    const cp = await this.chargePointsService.findOne(id);
    if (req.user.accountType === 'Admin') {
      if (cp.vendorId == null || req.user.vendorId == null || cp.vendorId !== req.user.vendorId) {
        throw new ForbiddenException('You can only delete charge points that belong to your vendor.');
      }
    }
    return this.chargePointsService.delete(id);
  }

  @Post(':id/clear-stale-operational-state')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Admin')
  @ApiOperation({
    summary:
      'Clear stuck Charging/Preparing state when there is no Active transaction (resets connector rows in DB)',
  })
  @ApiResponse({ status: 200, description: 'Stale operational state cleared' })
  @ApiResponse({ status: 400, description: 'Active session still exists' })
  @ApiResponse({ status: 403, description: 'Admin may only clear devices for their vendor' })
  async clearStaleOperationalState(
    @Param('id') id: string,
    @Request() req: { user: { accountType: string; vendorId?: number } },
  ) {
    const cp = await this.chargePointsService.findOne(id);
    if (req.user.accountType === 'Admin') {
      if (cp.vendorId == null || req.user.vendorId == null || cp.vendorId !== req.user.vendorId) {
        throw new ForbiddenException('You can only manage charge points that belong to your vendor.');
      }
    }
    return this.chargePointsService.clearStaleOperationalState(id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get charge point status' })
  @ApiResponse({ status: 200, description: 'Charge point status' })
  async getStatus(@Param('id') id: string): Promise<any> {
    return this.chargePointsService.getStatus(id);
  }

  @Get(':id/connectors')
  @ApiOperation({ summary: 'Get all connectors for a charge point' })
  @ApiResponse({ status: 200, description: 'List of connectors' })
  async getConnectors(@Param('id') id: string): Promise<any[]> {
    return this.chargePointsService.getConnectors(id);
  }

  @Get(':id/connectors/:connectorId')
  @ApiOperation({ summary: 'Get connector details' })
  @ApiResponse({ status: 200, description: 'Connector details' })
  async getConnector(
    @Param('id') id: string,
    @Param('connectorId') connectorId: number,
  ): Promise<any> {
    return this.chargePointsService.getConnector(id, connectorId);
  }

  @Post(':id/remote-start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remote start transaction' })
  @ApiResponse({ status: 200, description: 'Command sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or charge point not connected' })
  async remoteStartTransaction(
    @Param('id') id: string,
    @Body() body: { connectorId: number; idTag: string },
  ) {
    return this.chargePointsService.remoteStartTransaction(
      id,
      body.connectorId,
      body.idTag,
    );
  }

  @Post(':id/wallet-start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start wallet-based charging transaction' })
  @ApiResponse({ status: 200, description: 'Charging started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or insufficient balance' })
  async startWalletBasedCharging(
    @Param('id') id: string,
    @Body() body: { connectorId: number; userId: number; amount: number },
  ) {
    return this.chargePointsService.startWalletBasedCharging(
      id,
      body.connectorId,
      body.userId,
      body.amount,
    );
  }

  @Post(':id/remote-stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remote stop transaction' })
  @ApiResponse({ status: 200, description: 'Command sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or charge point not connected' })
  async remoteStopTransaction(
    @Param('id') id: string,
    @Body() body: { transactionId: number },
  ) {
    return this.chargePointsService.remoteStopTransaction(id, body.transactionId);
  }

  @Post(':id/connectors/:connectorId/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock connector' })
  @ApiResponse({ status: 200, description: 'Command sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or charge point not connected' })
  async unlockConnector(
    @Param('id') id: string,
    @Param('connectorId') connectorId: number,
  ) {
    return this.chargePointsService.unlockConnector(id, connectorId);
  }

  @Post(':id/change-availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change connector availability' })
  @ApiResponse({ status: 200, description: 'Command sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or charge point not connected' })
  async changeAvailability(
    @Param('id') id: string,
    @Body() body: { connectorId: number; type: 'Inoperative' | 'Operative' },
  ) {
    return this.chargePointsService.changeAvailability(
      id,
      body.connectorId,
      body.type,
    );
  }

  @Get(':id/configuration')
  @ApiOperation({ summary: 'Get charge point configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved' })
  @ApiResponse({ status: 400, description: 'Invalid request or charge point not connected' })
  async getConfiguration(
    @Param('id') id: string,
    @Query('keys') keys?: string,
  ) {
    const keyArray = keys ? keys.split(',') : undefined;
    return this.chargePointsService.getConfiguration(id, keyArray);
  }

  @Post(':id/configuration')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change charge point configuration' })
  @ApiResponse({ status: 200, description: 'Configuration changed' })
  @ApiResponse({ status: 400, description: 'Invalid request or charge point not connected' })
  async changeConfiguration(
    @Param('id') id: string,
    @Body() body: { key: string; value: string },
  ) {
    return this.chargePointsService.changeConfiguration(id, body.key, body.value);
  }

  @Post(':id/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset charge point' })
  @ApiResponse({ status: 200, description: 'Reset command sent' })
  async reset(
    @Param('id') id: string,
    @Body() body: { type: 'Hard' | 'Soft' },
  ) {
    return this.chargePointsService.reset(id, body.type);
  }

  @Post(':id/clear-cache')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear authorization cache' })
  @ApiResponse({ status: 200, description: 'Clear cache command sent' })
  async clearCache(@Param('id') id: string) {
    return this.chargePointsService.clearCache(id);
  }

  @Post(':id/reserve-now')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reserve connector' })
  @ApiResponse({ status: 200, description: 'Reservation command sent' })
  async reserveNow(
    @Param('id') id: string,
    @Body()
    body: {
      connectorId: number;
      expiryDate: string;
      idTag: string;
      reservationId: number;
      parentIdTag?: string;
    },
  ) {
    return this.chargePointsService.reserveNow(
      id,
      body.connectorId,
      body.expiryDate,
      body.idTag,
      body.reservationId,
      body.parentIdTag,
    );
  }

  @Post(':id/cancel-reservation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel reservation' })
  @ApiResponse({ status: 200, description: 'Cancel reservation command sent' })
  async cancelReservation(
    @Param('id') id: string,
    @Body() body: { reservationId: number },
  ) {
    return this.chargePointsService.cancelReservation(id, body.reservationId);
  }

  @Post(':id/send-local-list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send local authorization list' })
  @ApiResponse({ status: 200, description: 'Local list sent' })
  async sendLocalList(
    @Param('id') id: string,
    @Body()
    body: {
      listVersion: number;
      updateType: 'Full' | 'Differential';
      localAuthorizationList?: any[];
    },
  ) {
    return this.chargePointsService.sendLocalList(
      id,
      body.listVersion,
      body.updateType,
      body.localAuthorizationList,
    );
  }

  @Get(':id/local-list-version')
  @ApiOperation({ summary: 'Get local list version' })
  @ApiResponse({ status: 200, description: 'Local list version' })
  async getLocalListVersion(@Param('id') id: string) {
    return this.chargePointsService.getLocalListVersion(id);
  }

  @Post(':id/set-charging-profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set charging profile' })
  @ApiResponse({ status: 200, description: 'Charging profile set' })
  async setChargingProfile(
    @Param('id') id: string,
    @Body()
    body: {
      connectorId: number;
      chargingProfile: any;
    },
  ) {
    return this.chargePointsService.setChargingProfile(id, body.connectorId, body.chargingProfile);
  }

  @Post(':id/clear-charging-profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear charging profile' })
  @ApiResponse({ status: 200, description: 'Charging profile cleared' })
  async clearChargingProfile(
    @Param('id') id: string,
    @Body()
    body: {
      id?: number;
      connectorId?: number;
      chargingProfilePurpose?: string;
      stackLevel?: number;
    },
  ) {
    return this.chargePointsService.clearChargingProfile(
      id,
      body.id,
      body.connectorId,
      body.chargingProfilePurpose,
      body.stackLevel,
    );
  }

  @Get(':id/composite-schedule')
  @ApiOperation({ summary: 'Get composite schedule' })
  @ApiResponse({ status: 200, description: 'Composite schedule' })
  async getCompositeSchedule(
    @Param('id') id: string,
    @Query('connectorId') connectorId: number,
    @Query('duration') duration: number,
    @Query('chargingRateUnit') chargingRateUnit?: 'A' | 'W',
  ) {
    return this.chargePointsService.getCompositeSchedule(id, connectorId, duration, chargingRateUnit);
  }

  @Post(':id/update-firmware')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update firmware' })
  @ApiResponse({ status: 200, description: 'Firmware update initiated' })
  async updateFirmware(
    @Param('id') id: string,
    @Body()
    body: {
      location: string;
      retrieveDate: string;
      retryInterval?: number;
      retries?: number;
    },
  ) {
    return this.chargePointsService.updateFirmware(
      id,
      body.location,
      body.retrieveDate,
      body.retryInterval,
      body.retries,
    );
  }

  @Post(':id/get-diagnostics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get diagnostics' })
  @ApiResponse({ status: 200, description: 'Diagnostics request sent' })
  async getDiagnostics(
    @Param('id') id: string,
    @Body()
    body: {
      location: string;
      startTime?: string;
      stopTime?: string;
      retryInterval?: number;
      retries?: number;
    },
  ) {
    return this.chargePointsService.getDiagnostics(
      id,
      body.location,
      body.startTime,
      body.stopTime,
      body.retryInterval,
      body.retries,
    );
  }

  @Post(':id/data-transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Data transfer' })
  @ApiResponse({ status: 200, description: 'Data transfer sent' })
  async dataTransfer(
    @Param('id') id: string,
    @Body()
    body: {
      vendorId: string;
      messageId?: string;
      data?: string;
    },
  ) {
    return this.chargePointsService.dataTransfer(id, body.vendorId, body.messageId, body.data);
  }
}

