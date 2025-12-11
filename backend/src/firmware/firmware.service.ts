import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirmwareJob } from '../entities/firmware-job.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { ChargePointsService } from '../charge-points/charge-points.service';

@Injectable()
export class FirmwareService {
  private readonly logger = new Logger(FirmwareService.name);

  constructor(
    @InjectRepository(FirmwareJob)
    private firmwareJobRepository: Repository<FirmwareJob>,
    @InjectRepository(ChargePoint)
    private chargePointRepository: Repository<ChargePoint>,
    private chargePointsService: ChargePointsService,
  ) {}

  /**
   * Update firmware
   */
  async updateFirmware(data: {
    chargePointId: string;
    location: string;
    retrieveDate: string;
    retryInterval?: number;
    retries?: number;
  }): Promise<{ status: string }> {
    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId: data.chargePointId },
    });

    if (!chargePoint) {
      throw new NotFoundException(`Charge point ${data.chargePointId} not found`);
    }

    // Check if there's already a pending firmware job
    const existingJob = await this.firmwareJobRepository.findOne({
      where: {
        chargePointId: data.chargePointId,
        status: 'Pending',
      },
    });

    if (existingJob) {
      throw new BadRequestException('Firmware update already in progress');
    }

    // Create firmware job
    const firmwareJob = this.firmwareJobRepository.create({
      chargePointId: data.chargePointId,
      location: data.location,
      retrieveDate: new Date(data.retrieveDate),
      retryInterval: data.retryInterval || 0,
      retries: data.retries || 0,
      status: 'Pending',
    });

    await this.firmwareJobRepository.save(firmwareJob);

    // Send to charge point via OCPP
    try {
      const result = await this.chargePointsService.updateFirmware(
        data.chargePointId,
        data.location,
        data.retrieveDate,
        data.retryInterval,
        data.retries,
      );

      if (result.status === 'Accepted' || result.status === 'AcceptedCanceled') {
        firmwareJob.status = 'Downloading';
        await this.firmwareJobRepository.save(firmwareJob);
      } else {
        firmwareJob.status = 'InstallationFailed';
        await this.firmwareJobRepository.save(firmwareJob);
      }

      this.logger.log(`Firmware update initiated for ${data.chargePointId}, job ID: ${firmwareJob.id}`);

      return { status: result.status || 'Rejected' };
    } catch (error: any) {
      firmwareJob.status = 'InstallationFailed';
      await this.firmwareJobRepository.save(firmwareJob);
      throw error;
    }
  }

  /**
   * Get firmware jobs for charge point
   */
  async getFirmwareJobs(chargePointId: string): Promise<FirmwareJob[]> {
    return this.firmwareJobRepository.find({
      where: { chargePointId },
      order: { createdAt: 'DESC' },
      relations: ['chargePoint'],
    });
  }

  /**
   * Get firmware job by ID
   */
  async getFirmwareJob(id: number): Promise<FirmwareJob> {
    const job = await this.firmwareJobRepository.findOne({
      where: { id },
      relations: ['chargePoint'],
    });

    if (!job) {
      throw new NotFoundException(`Firmware job ${id} not found`);
    }

    return job;
  }

  /**
   * Update firmware job status (called by charge point via StatusNotification)
   */
  async updateFirmwareJobStatus(
    chargePointId: string,
    status: 'Downloading' | 'Installing' | 'Installed' | 'InstallationFailed',
  ): Promise<void> {
    const job = await this.firmwareJobRepository.findOne({
      where: {
        chargePointId,
        status: 'Pending',
      },
      order: { createdAt: 'DESC' },
    });

    if (job) {
      job.status = status;
      await this.firmwareJobRepository.save(job);
      this.logger.log(`Firmware job ${job.id} status updated to ${status}`);
    }
  }
}



