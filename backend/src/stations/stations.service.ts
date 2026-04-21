import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ChargePoint } from '../entities/charge-point.entity';
import { Connector } from '../entities/connector.entity';
import { Transaction } from '../entities/transaction.entity';

export interface NearbyStationQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number; // Default 50km
  status?: string[];
  connectorType?: string;
  minPowerKw?: number;
  limit?: number; // Default 20
}

export interface StationWithDistance extends ChargePoint {
  distanceKm: number;
  availableConnectors: number;
  totalConnectors: number;
  activeSessions: number;
}

@Injectable()
export class StationsService {
  private readonly logger = new Logger(StationsService.name);

  constructor(
    @InjectRepository(ChargePoint)
    private chargePointRepository: Repository<ChargePoint>,
    @InjectRepository(Connector)
    private connectorRepository: Repository<Connector>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  /**
   * Find nearby stations within a radius
   * Uses Haversine formula for distance calculation
   */
  async findNearby(query: NearbyStationQuery): Promise<StationWithDistance[]> {
    const {
      latitude,
      longitude,
      radiusKm = 50,
      status = ['Available', 'Charging', 'Preparing', 'Finishing'],
      connectorType,
      minPowerKw,
      limit = 20,
    } = query;

    // Build base query
    let queryBuilder = this.chargePointRepository
      .createQueryBuilder('cp')
      .where('cp.location_latitude IS NOT NULL')
      .andWhere('cp.location_longitude IS NOT NULL');

    // Filter by status if provided
    if (status && status.length > 0) {
      queryBuilder = queryBuilder.andWhere('cp.status IN (:...status)', { status });
    }

    // Get all stations first (we'll calculate distance in application)
    // For better performance with large datasets, consider using PostGIS
    const stations = await queryBuilder.getMany();

    // Calculate distance and filter by radius
    const stationsWithDistance: StationWithDistance[] = [];

    for (const station of stations) {
      if (!station.locationLatitude || !station.locationLongitude) continue;

      const distance = this.calculateDistance(
        latitude,
        longitude,
        parseFloat(station.locationLatitude.toString()),
        parseFloat(station.locationLongitude.toString()),
      );

      if (distance <= radiusKm) {
        // Get connector information
        const connectors = await this.connectorRepository.find({
          where: { chargePointId: station.chargePointId },
        });

        // Filter by connector type if specified
        if (connectorType) {
          const filteredConnectors = connectors.filter(
            (c) => c.connectorType === connectorType,
          );
          if (filteredConnectors.length === 0) continue;
        }

        // Filter by minimum power if specified
        if (minPowerKw) {
          const hasMinPower = connectors.some((c) => (c.powerRatingKw || 0) >= minPowerKw);
          if (!hasMinPower) continue;
        }

        // Count active sessions
        const activeSessions = await this.transactionRepository.count({
          where: {
            chargePointId: station.chargePointId,
            status: 'Active',
          },
        });

        stationsWithDistance.push(
          this.buildStationWithDistance(
            station,
            connectors,
            activeSessions,
            Math.round(distance * 100) / 100,
          ),
        );
      }
    }

    // Sort by distance and limit results
    return stationsWithDistance
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  }

  /**
   * Find stations in a map bounds (for map view)
   */
  async findInBounds(
    north: number,
    south: number,
    east: number,
    west: number,
    status?: string[],
  ): Promise<ChargePoint[]> {
    let queryBuilder = this.chargePointRepository
      .createQueryBuilder('cp')
      .where('cp.location_latitude BETWEEN :south AND :north', { south, north })
      .andWhere('cp.location_longitude BETWEEN :west AND :east', { west, east })
      .andWhere('cp.location_latitude IS NOT NULL')
      .andWhere('cp.location_longitude IS NOT NULL');

    if (status && status.length > 0) {
      queryBuilder = queryBuilder.andWhere('cp.status IN (:...status)', { status });
    }

    return queryBuilder.getMany();
  }

  /**
   * Get station details with real-time information
   */
  async getStationDetails(chargePointId: string): Promise<any> {
    const station = await this.chargePointRepository.findOne({
      where: { chargePointId },
    });

    if (!station) {
      return null;
    }

    const connectors = await this.connectorRepository.find({
      where: { chargePointId },
    });

    const activeSessions = await this.transactionRepository.find({
      where: {
        chargePointId,
        status: 'Active',
      },
    });

    const status = this.deriveCustomerVisibleStatus(station, connectors, activeSessions.length);
    const activeSessionsDisplay = this.effectiveActiveSessionCount(
      connectors,
      activeSessions.length,
    );

    return {
      ...station,
      status,
      connectors,
      availableConnectors: this.countCustomerVisibleAvailableConnectors(connectors),
      totalConnectors: connectors.length,
      activeSessions: activeSessionsDisplay,
      activeTransactions: activeSessions,
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  /** Slots that can accept Remote Start (matches device-management semantics). */
  private countCustomerVisibleAvailableConnectors(connectors: Connector[]): number {
    return connectors.filter((c) => ['Available', 'Preparing'].includes(c.status)).length;
  }

  /**
   * Match Operations → Devices: CP row shows Charging when connectors report charging-like states,
   * even if charge_points.status was not updated or CSMS missed an Active transaction row.
   */
  private deriveCustomerVisibleStatus(
    station: ChargePoint,
    connectors: Connector[],
    activeDbSessions: number,
  ): string {
    if (activeDbSessions > 0) {
      return 'Charging';
    }
    const chargingLike = connectors.some((c) =>
      ['Charging', 'Finishing', 'SuspendedEVSE', 'SuspendedEV'].includes(c.status),
    );
    if (chargingLike) {
      return 'Charging';
    }
    if (connectors.some((c) => c.status === 'Preparing')) {
      return 'Preparing';
    }
    return station.status;
  }

  private effectiveActiveSessionCount(
    connectors: Connector[],
    activeDbSessionCount: number,
  ): number {
    if (activeDbSessionCount > 0) return activeDbSessionCount;
    const connectorLive = connectors.some((c) =>
      ['Charging', 'Finishing', 'SuspendedEVSE', 'SuspendedEV'].includes(c.status),
    );
    return connectorLive ? 1 : 0;
  }

  private buildStationWithDistance(
    station: ChargePoint,
    connectors: Connector[],
    activeSessions: number,
    distanceKm: number,
  ): StationWithDistance {
    const availableConnectors = this.countCustomerVisibleAvailableConnectors(connectors);
    const status = this.deriveCustomerVisibleStatus(station, connectors, activeSessions);
    const activeSessionsDisplay = this.effectiveActiveSessionCount(connectors, activeSessions);
    return {
      ...station,
      status,
      distanceKm,
      availableConnectors,
      totalConnectors: connectors.length,
      activeSessions: activeSessionsDisplay,
    };
  }

  /**
   * Load connectors, session count, and optional distance from user location (for search / by-ids).
   */
  private async enrichChargePointToStationWithDistance(
    station: ChargePoint,
    options?: { userLat?: number; userLng?: number; distanceKm?: number },
  ): Promise<StationWithDistance> {
    const connectors = await this.connectorRepository.find({
      where: { chargePointId: station.chargePointId },
    });
    const activeSessions = await this.transactionRepository.count({
      where: {
        chargePointId: station.chargePointId,
        status: 'Active',
      },
    });

    let distanceKm = options?.distanceKm ?? 0;
    if (
      options?.distanceKm === undefined &&
      options?.userLat != null &&
      options?.userLng != null &&
      station.locationLatitude != null &&
      station.locationLongitude != null
    ) {
      distanceKm =
        Math.round(
          this.calculateDistance(
            options.userLat,
            options.userLng,
            parseFloat(station.locationLatitude.toString()),
            parseFloat(station.locationLongitude.toString()),
          ) * 100,
        ) / 100;
    }

    return this.buildStationWithDistance(station, connectors, activeSessions, distanceKm);
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get stations by charge point IDs (for favorites)
   */
  async getByIds(chargePointIds: string[]): Promise<StationWithDistance[]> {
    if (chargePointIds.length === 0) return [];

    const stations = await this.chargePointRepository
      .createQueryBuilder('cp')
      .where('cp.charge_point_id IN (:...ids)', { ids: chargePointIds })
      .getMany();

    const result: StationWithDistance[] = [];

    for (const station of stations) {
      try {
        result.push(
          await this.enrichChargePointToStationWithDistance(station, { distanceKm: 0 }),
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`getByIds: skip ${station.chargePointId}: ${msg}`);
      }
    }

    return result;
  }

  /**
   * Search stations by location name, city, region, or landmarks
   */
  async searchStations(
    searchTerm: string,
    limit: number = 50,
    userLocation?: { latitude: number; longitude: number },
  ): Promise<StationWithDistance[]> {
    const rows = await this.chargePointRepository
      .createQueryBuilder('cp')
      .where(
        '(cp.location_name ILIKE :search OR cp.location_city ILIKE :search OR cp.location_region ILIKE :search OR cp.location_address ILIKE :search OR cp.location_landmarks ILIKE :search OR cp.charge_point_id ILIKE :search)',
        { search: `%${searchTerm}%` },
      )
      .andWhere('cp.location_latitude IS NOT NULL')
      .andWhere('cp.location_longitude IS NOT NULL')
      .orderBy('cp.location_name', 'ASC')
      .limit(limit)
      .getMany();

    const enriched = await Promise.all(
      rows.map((cp) =>
        this.enrichChargePointToStationWithDistance(cp, {
          userLat: userLocation?.latitude,
          userLng: userLocation?.longitude,
        }),
      ),
    );

    if (userLocation) {
      enriched.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return enriched;
  }
}

