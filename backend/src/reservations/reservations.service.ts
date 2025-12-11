import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { Connector } from '../entities/connector.entity';
import { IdTag } from '../entities/id-tag.entity';
import { ChargePointsService } from '../charge-points/charge-points.service';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(ChargePoint)
    private chargePointRepository: Repository<ChargePoint>,
    @InjectRepository(Connector)
    private connectorRepository: Repository<Connector>,
    @InjectRepository(IdTag)
    private idTagRepository: Repository<IdTag>,
    private chargePointsService: ChargePointsService,
  ) {}

  /**
   * Create a reservation
   */
  async createReservation(data: {
    chargePointId: string;
    reservationId: number;
    connectorId: number;
    idTag: string;
    parentIdTag?: string;
    expiryDate: string;
  }): Promise<{ status: string }> {
    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId: data.chargePointId },
    });

    if (!chargePoint) {
      throw new NotFoundException(`Charge point ${data.chargePointId} not found`);
    }

    // Check if connector exists
    const connector = await this.connectorRepository.findOne({
      where: { chargePointId: data.chargePointId, connectorId: data.connectorId },
    });

    if (!connector) {
      return { status: 'Rejected' };
    }

    // Check if connector is available or reserved
    if (connector.status !== 'Available' && connector.status !== 'Reserved') {
      return { status: 'Occupied' };
    }

    // Check if reservation ID already exists
    const existing = await this.reservationRepository.findOne({
      where: { reservationId: data.reservationId },
    });

    if (existing) {
      return { status: 'Rejected' };
    }

    // Check if connector already has an active reservation
    const activeReservation = await this.reservationRepository.findOne({
      where: {
        chargePointId: data.chargePointId,
        connectorId: data.connectorId,
        status: 'Active',
        expiryDate: MoreThan(new Date()),
      },
    });

    if (activeReservation) {
      return { status: 'Occupied' };
    }

    // Create reservation
    const reservation = this.reservationRepository.create({
      reservationId: data.reservationId,
      chargePointId: data.chargePointId,
      connectorId: data.connectorId,
      idTag: data.idTag,
      expiryDate: new Date(data.expiryDate),
      status: 'Active',
    });

    await this.reservationRepository.save(reservation);

    // Update connector status to Reserved
    connector.status = 'Reserved';
    await this.connectorRepository.save(connector);

    this.logger.log(`Reservation ${data.reservationId} created for ${data.chargePointId}, connector ${data.connectorId}`);

    return { status: 'Accepted' };
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(chargePointId: string, reservationId: number): Promise<{ status: string }> {
    const reservation = await this.reservationRepository.findOne({
      where: { reservationId, chargePointId },
    });

    if (!reservation) {
      return { status: 'Rejected' };
    }

    if (reservation.status !== 'Active') {
      return { status: 'Rejected' };
    }

    // Update reservation status
    reservation.status = 'Cancelled';
    await this.reservationRepository.save(reservation);

    // Update connector status back to Available
    const connector = await this.connectorRepository.findOne({
      where: { chargePointId, connectorId: reservation.connectorId },
    });

    if (connector) {
      connector.status = 'Available';
      await this.connectorRepository.save(connector);
    }

    this.logger.log(`Reservation ${reservationId} cancelled for ${chargePointId}`);

    return { status: 'Accepted' };
  }

  /**
   * Get reservation by ID
   */
  async getReservation(reservationId: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { reservationId },
      relations: ['chargePoint', 'idTagEntity'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }

    return reservation;
  }

  /**
   * Get reservations for charge point
   */
  async getReservationsForChargePoint(chargePointId: string): Promise<Reservation[]> {
    return this.reservationRepository.find({
      where: { chargePointId },
      order: { createdAt: 'DESC' },
      relations: ['idTagEntity'],
    });
  }

  /**
   * Get active reservations
   */
  async getActiveReservations(chargePointId?: string): Promise<Reservation[]> {
    const where: any = {
      status: 'Active',
      expiryDate: MoreThan(new Date()),
    };

    if (chargePointId) {
      where.chargePointId = chargePointId;
    }

    return this.reservationRepository.find({
      where,
      order: { expiryDate: 'ASC' },
      relations: ['chargePoint', 'idTagEntity'],
    });
  }

  /**
   * Clean up expired reservations
   */
  async cleanupExpiredReservations(): Promise<void> {
    const expired = await this.reservationRepository.find({
      where: {
        status: 'Active',
        expiryDate: MoreThan(new Date()),
      },
    });

    for (const reservation of expired) {
      reservation.status = 'Expired';
      await this.reservationRepository.save(reservation);

      // Update connector status
      const connector = await this.connectorRepository.findOne({
        where: {
          chargePointId: reservation.chargePointId,
          connectorId: reservation.connectorId,
        },
      });

      if (connector && connector.status === 'Reserved') {
        connector.status = 'Available';
        await this.connectorRepository.save(connector);
      }
    }

    if (expired.length > 0) {
      this.logger.log(`Cleaned up ${expired.length} expired reservations`);
    }
  }
}



