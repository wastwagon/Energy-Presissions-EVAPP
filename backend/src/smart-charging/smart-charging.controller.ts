import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SmartChargingService } from './smart-charging.service';

@ApiTags('Smart Charging')
@Controller('smart-charging')
export class SmartChargingController {
  constructor(private readonly smartChargingService: SmartChargingService) {}

  @Post('set-profile')
  @ApiOperation({ summary: 'Set charging profile' })
  @ApiResponse({ status: 200, description: 'Charging profile set' })
  async setChargingProfile(@Body() body: any) {
    return this.smartChargingService.setChargingProfile(body);
  }

  @Post('clear-profile')
  @ApiOperation({ summary: 'Clear charging profile' })
  @ApiResponse({ status: 200, description: 'Charging profile cleared' })
  async clearChargingProfile(@Body() body: any) {
    return this.smartChargingService.clearChargingProfile(body);
  }

  @Get('composite-schedule')
  @ApiOperation({ summary: 'Get composite schedule' })
  @ApiResponse({ status: 200, description: 'Composite schedule' })
  async getCompositeSchedule(
    @Query('chargePointId') chargePointId: string,
    @Query('connectorId', ParseIntPipe) connectorId: number,
    @Query('duration', ParseIntPipe) duration: number,
    @Query('chargingRateUnit') chargingRateUnit?: 'A' | 'W',
  ) {
    return this.smartChargingService.getCompositeSchedule(
      chargePointId,
      connectorId,
      duration,
      chargingRateUnit,
    );
  }

  @Get('profiles/:chargePointId')
  @ApiOperation({ summary: 'Get charging profiles for charge point' })
  @ApiResponse({ status: 200, description: 'List of charging profiles' })
  async getChargingProfiles(
    @Param('chargePointId') chargePointId: string,
    @Query('connectorId') connectorId?: number,
  ) {
    return this.smartChargingService.getChargingProfiles(
      chargePointId,
      connectorId ? parseInt(connectorId.toString()) : undefined,
    );
  }

  @Get('profile/:id')
  @ApiOperation({ summary: 'Get charging profile by ID' })
  @ApiResponse({ status: 200, description: 'Charging profile details' })
  async getChargingProfile(@Param('id', ParseIntPipe) id: number) {
    return this.smartChargingService.getChargingProfile(id);
  }
}



