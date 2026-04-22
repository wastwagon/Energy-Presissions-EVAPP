import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LocalAuthList } from '../entities/local-auth-list.entity';
import { LocalAuthListVersion } from '../entities/local-auth-list-version.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { ChargePointsService } from '../charge-points/charge-points.service';

@Injectable()
export class LocalAuthListService {
  private readonly logger = new Logger(LocalAuthListService.name);

  constructor(
    @InjectRepository(LocalAuthList)
    private localAuthListRepository: Repository<LocalAuthList>,
    @InjectRepository(LocalAuthListVersion)
    private localAuthListVersionRepository: Repository<LocalAuthListVersion>,
    @InjectRepository(ChargePoint)
    private chargePointRepository: Repository<ChargePoint>,
    private chargePointsService: ChargePointsService,
    private dataSource: DataSource,
  ) {}

  /**
   * Get local list version for charge point
   */
  async getLocalListVersion(chargePointId: string): Promise<{ listVersion: number }> {
    const version = await this.localAuthListVersionRepository.findOne({
      where: { chargePointId },
    });

    return { listVersion: version?.listVersion || 0 };
  }

  /**
   * Send local authorization list to charge point
   */
  async sendLocalList(data: {
    chargePointId: string;
    listVersion: number;
    updateType: 'Full' | 'Differential';
    localAuthorizationList: Array<{
      idTag: string;
      idTagInfo: {
        status: string;
        expiryDate?: string;
        parentIdTag?: string;
      };
    }>;
  }): Promise<{ status: string }> {
    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId: data.chargePointId },
    });

    if (!chargePoint) {
      throw new NotFoundException(`Charge point ${data.chargePointId} not found`);
    }

    // Check current version
    const currentVersion = await this.localAuthListVersionRepository.findOne({
      where: { chargePointId: data.chargePointId },
    });

    if (currentVersion && currentVersion.listVersion >= data.listVersion) {
      return { status: 'VersionMismatch' };
    }

    // Send to charge point via OCPP
    try {
      const result = await this.chargePointsService.sendLocalList(
        data.chargePointId,
        data.listVersion,
        data.updateType,
        data.localAuthorizationList,
      );

      if (result.status !== 'Accepted') {
        return { status: result.status || 'Failed' };
      }

      // Update database
      return this.dataSource.transaction(async (manager) => {
        if (data.updateType === 'Full') {
          // Delete all existing entries
          await manager.delete(LocalAuthList, { chargePointId: data.chargePointId });
        }

        // Insert/update entries
        for (const entry of data.localAuthorizationList) {
          await manager.upsert(
            LocalAuthList,
            {
              chargePointId: data.chargePointId,
              idTag: entry.idTag,
              idTagInfo: entry.idTagInfo as any,
              listVersion: data.listVersion,
            },
            ['chargePointId', 'idTag'],
          );
        }

        // Update version
        await manager.upsert(
          LocalAuthListVersion,
          {
            chargePointId: data.chargePointId,
            listVersion: data.listVersion,
            updateType: data.updateType,
          },
          ['chargePointId'],
        );

        this.logger.log(
          `Local auth list sent to ${data.chargePointId}, version ${data.listVersion}, type: ${data.updateType}`,
        );

        return { status: 'Accepted' };
      });
    } catch (error: any) {
      this.logger.error(`Error sending local auth list to ${data.chargePointId}:`, error);
      return { status: 'Failed' };
    }
  }

  /**
   * Get local auth list for charge point
   */
  async getLocalAuthList(chargePointId: string): Promise<LocalAuthList[]> {
    return this.localAuthListRepository.find({
      where: { chargePointId },
      order: { idTag: 'ASC' },
    });
  }

  /**
   * Get local auth list entry
   */
  async getLocalAuthListEntry(chargePointId: string, idTag: string): Promise<LocalAuthList | null> {
    return this.localAuthListRepository.findOne({
      where: { chargePointId, idTag },
    });
  }
}

