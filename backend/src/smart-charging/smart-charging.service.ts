import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargingProfile } from '../entities/charging-profile.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { Transaction } from '../entities/transaction.entity';
import { ChargePointsService } from '../charge-points/charge-points.service';

@Injectable()
export class SmartChargingService {
  private readonly logger = new Logger(SmartChargingService.name);

  constructor(
    @InjectRepository(ChargingProfile)
    private chargingProfileRepository: Repository<ChargingProfile>,
    @InjectRepository(ChargePoint)
    private chargePointRepository: Repository<ChargePoint>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private chargePointsService: ChargePointsService,
  ) {}

  /**
   * Set charging profile
   */
  async setChargingProfile(data: {
    chargePointId: string;
    connectorId: number;
    chargingProfile: {
      chargingProfileId: number;
      transactionId?: number;
      stackLevel: number;
      chargingProfilePurpose: string;
      chargingProfileKind: string;
      recurrencyKind?: string;
      validFrom?: string;
      validTo?: string;
      chargingSchedule: any;
    };
  }): Promise<{ status: string }> {
    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId: data.chargePointId },
    });

    if (!chargePoint) {
      throw new NotFoundException(`Charge point ${data.chargePointId} not found`);
    }

    // Send to charge point via OCPP
    const result = await this.chargePointsService.setChargingProfile(
      data.chargePointId,
      data.connectorId,
      data.chargingProfile,
    );

    if (result.status !== 'Accepted') {
      return { status: result.status || 'Rejected' };
    }

    // Save to database
    const profile = this.chargingProfileRepository.create({
      chargePointId: data.chargePointId,
      connectorId: data.connectorId,
      transactionId: data.chargingProfile.transactionId,
      stackLevel: data.chargingProfile.stackLevel,
      chargingProfilePurpose: data.chargingProfile.chargingProfilePurpose,
      chargingProfileKind: data.chargingProfile.chargingProfileKind,
      validFrom: data.chargingProfile.validFrom ? new Date(data.chargingProfile.validFrom) : null,
      validTo: data.chargingProfile.validTo ? new Date(data.chargingProfile.validTo) : null,
      chargingSchedule: data.chargingProfile.chargingSchedule,
    });

    await this.chargingProfileRepository.save(profile);

    this.logger.log(
      `Charging profile ${data.chargingProfile.chargingProfileId} set for ${data.chargePointId}, connector ${data.connectorId}`,
    );

    return { status: 'Accepted' };
  }

  /**
   * Clear charging profile
   */
  async clearChargingProfile(data: {
    chargePointId: string;
    id?: number;
    connectorId?: number;
    chargingProfilePurpose?: string;
    stackLevel?: number;
  }): Promise<{ status: string }> {
    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId: data.chargePointId },
    });

    if (!chargePoint) {
      throw new NotFoundException(`Charge point ${data.chargePointId} not found`);
    }

    // Send to charge point via OCPP
    const result = await this.chargePointsService.clearChargingProfile(
      data.chargePointId,
      data.id,
      data.connectorId,
      data.chargingProfilePurpose,
      data.stackLevel,
    );

    if (result.status !== 'Accepted') {
      return { status: result.status || 'Unknown' };
    }

    // Delete from database
    const where: any = { chargePointId: data.chargePointId };
    if (data.id) where.id = data.id;
    if (data.connectorId) where.connectorId = data.connectorId;
    if (data.chargingProfilePurpose) where.chargingProfilePurpose = data.chargingProfilePurpose;
    if (data.stackLevel !== undefined) where.stackLevel = data.stackLevel;

    await this.chargingProfileRepository.delete(where);

    this.logger.log(`Charging profile cleared for ${data.chargePointId}`);

    return { status: 'Accepted' };
  }

  /**
   * Get composite schedule
   */
  async getCompositeSchedule(
    chargePointId: string,
    connectorId: number,
    duration: number,
    chargingRateUnit?: 'A' | 'W',
  ): Promise<any> {
    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId },
    });

    if (!chargePoint) {
      throw new NotFoundException(`Charge point ${chargePointId} not found`);
    }

    return this.chargePointsService.getCompositeSchedule(
      chargePointId,
      connectorId,
      duration,
      chargingRateUnit,
    );
  }

  /**
   * Get charging profiles for charge point
   */
  async getChargingProfiles(chargePointId: string, connectorId?: number): Promise<ChargingProfile[]> {
    const where: any = { chargePointId };
    if (connectorId !== undefined) {
      where.connectorId = connectorId;
    }

    return this.chargingProfileRepository.find({
      where,
      order: { stackLevel: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * Get charging profile by ID
   */
  async getChargingProfile(id: number): Promise<ChargingProfile> {
    const profile = await this.chargingProfileRepository.findOne({
      where: { id },
      relations: ['chargePoint', 'transaction'],
    });

    if (!profile) {
      throw new NotFoundException(`Charging profile ${id} not found`);
    }

    return profile;
  }
}



