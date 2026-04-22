import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosticsJob } from '../entities/diagnostics-job.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { ChargePointsService } from '../charge-points/charge-points.service';

@Injectable()
export class DiagnosticsService {
  private readonly logger = new Logger(DiagnosticsService.name);

  constructor(
    @InjectRepository(DiagnosticsJob)
    private diagnosticsJobRepository: Repository<DiagnosticsJob>,
    @InjectRepository(ChargePoint)
    private chargePointRepository: Repository<ChargePoint>,
    private chargePointsService: ChargePointsService,
  ) {}

  /**
   * Get diagnostics
   */
  async getDiagnostics(data: {
    chargePointId: string;
    location: string;
    startTime?: string;
    stopTime?: string;
    retryInterval?: number;
    retries?: number;
  }): Promise<{ status: string; fileName?: string }> {
    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId: data.chargePointId },
    });

    if (!chargePoint) {
      throw new NotFoundException(`Charge point ${data.chargePointId} not found`);
    }

    // Check if there's already a pending diagnostics job
    const existingJob = await this.diagnosticsJobRepository.findOne({
      where: {
        chargePointId: data.chargePointId,
        status: 'Pending',
      },
    });

    if (existingJob) {
      throw new BadRequestException('Diagnostics upload already in progress');
    }

    // Create diagnostics job
    const diagnosticsJob = this.diagnosticsJobRepository.create({
      chargePointId: data.chargePointId,
      location: data.location,
      startTime: data.startTime ? new Date(data.startTime) : null,
      stopTime: data.stopTime ? new Date(data.stopTime) : null,
      status: 'Pending',
    });

    await this.diagnosticsJobRepository.save(diagnosticsJob);

    // Send to charge point via OCPP
    try {
      const result = await this.chargePointsService.getDiagnostics(
        data.chargePointId,
        data.location,
        data.startTime,
        data.stopTime,
        data.retryInterval,
        data.retries,
      );

      if (result.status === 'Accepted') {
        diagnosticsJob.status = 'Uploading';
        await this.diagnosticsJobRepository.save(diagnosticsJob);
      } else {
        diagnosticsJob.status = 'UploadFailed';
        await this.diagnosticsJobRepository.save(diagnosticsJob);
      }

      this.logger.log(`Diagnostics request sent for ${data.chargePointId}, job ID: ${diagnosticsJob.id}`);

      return {
        status: result.status || 'Rejected',
        fileName: result.fileName,
      };
    } catch (error: any) {
      diagnosticsJob.status = 'UploadFailed';
      await this.diagnosticsJobRepository.save(diagnosticsJob);
      throw error;
    }
  }

  /**
   * Get diagnostics jobs for charge point
   */
  async getDiagnosticsJobs(chargePointId: string): Promise<DiagnosticsJob[]> {
    return this.diagnosticsJobRepository.find({
      where: { chargePointId },
      order: { createdAt: 'DESC' },
      relations: ['chargePoint'],
    });
  }

  /**
   * Get diagnostics job by ID
   */
  async getDiagnosticsJob(id: number): Promise<DiagnosticsJob> {
    const job = await this.diagnosticsJobRepository.findOne({
      where: { id },
      relations: ['chargePoint'],
    });

    if (!job) {
      throw new NotFoundException(`Diagnostics job ${id} not found`);
    }

    return job;
  }

  /**
   * Update diagnostics job status (called when upload completes)
   */
  async updateDiagnosticsJobStatus(
    chargePointId: string,
    status: 'Uploading' | 'Uploaded' | 'UploadFailed',
    _fileName?: string,
  ): Promise<void> {
    const job = await this.diagnosticsJobRepository.findOne({
      where: {
        chargePointId,
        status: 'Pending',
      },
      order: { createdAt: 'DESC' },
    });

    if (!job) {
      // Try to find uploading job
      const uploadingJob = await this.diagnosticsJobRepository.findOne({
        where: {
          chargePointId,
          status: 'Uploading',
        },
        order: { createdAt: 'DESC' },
      });

      if (uploadingJob) {
        uploadingJob.status = status;
        await this.diagnosticsJobRepository.save(uploadingJob);
        this.logger.log(`Diagnostics job ${uploadingJob.id} status updated to ${status}`);
      }
      return;
    }

    job.status = status;
    await this.diagnosticsJobRepository.save(job);
    this.logger.log(`Diagnostics job ${job.id} status updated to ${status}`);
  }
}



