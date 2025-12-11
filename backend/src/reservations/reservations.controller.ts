import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({ status: 201, description: 'Reservation created' })
  async createReservation(
    @Body()
    body: {
      chargePointId: string;
      reservationId: number;
      connectorId: number;
      idTag: string;
      parentIdTag?: string;
      expiryDate: string;
    },
  ) {
    return this.reservationsService.createReservation(body);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled' })
  async cancelReservation(
    @Param('id', ParseIntPipe) reservationId: number,
    @Body('chargePointId') chargePointId: string,
  ) {
    return this.reservationsService.cancelReservation(chargePointId, reservationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation by ID' })
  @ApiResponse({ status: 200, description: 'Reservation details' })
  async getReservation(@Param('id', ParseIntPipe) reservationId: number) {
    return this.reservationsService.getReservation(reservationId);
  }

  @Get('charge-point/:chargePointId')
  @ApiOperation({ summary: 'Get reservations for a charge point' })
  @ApiResponse({ status: 200, description: 'List of reservations' })
  async getReservationsForChargePoint(@Param('chargePointId') chargePointId: string) {
    return this.reservationsService.getReservationsForChargePoint(chargePointId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active reservations' })
  @ApiResponse({ status: 200, description: 'List of active reservations' })
  async getActiveReservations(@Query('chargePointId') chargePointId?: string) {
    return this.reservationsService.getActiveReservations(chargePointId);
  }
}



