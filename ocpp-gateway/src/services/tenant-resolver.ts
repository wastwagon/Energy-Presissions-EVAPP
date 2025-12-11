import axios from 'axios';
import { logger } from '../utils/logger';

const CSMS_API_URL = process.env.CSMS_API_URL || 'http://csms-api:3000';
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'your-service-token-change-in-production';

interface ChargePointInfo {
  id: number;
  chargePointId: string;
  tenantId: number;
}

/**
 * Service to resolve tenantId from chargePointId
 * Caches results in memory for performance
 */
export class TenantResolver {
  private cache: Map<string, number> = new Map();
  private cacheTTL: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Resolve tenantId from chargePointId
   */
  async resolveTenantId(chargePointId: string): Promise<number | null> {
    // Check cache first
    const cached = this.cache.get(chargePointId);
    const cachedTime = this.cacheTTL.get(chargePointId);
    
    if (cached && cachedTime && Date.now() - cachedTime < this.CACHE_DURATION) {
      return cached;
    }

    try {
      // Query CSMS API for charge point info
      const response = await axios.get<ChargePointInfo>(
        `${CSMS_API_URL}/api/internal/charge-points/${chargePointId}/tenant`,
        {
          headers: {
            Authorization: `Bearer ${SERVICE_TOKEN}`,
          },
          timeout: 5000,
        },
      );

      const tenantId = response.data.tenantId;
      
      // Cache the result
      this.cache.set(chargePointId, tenantId);
      this.cacheTTL.set(chargePointId, Date.now());

      return tenantId;
    } catch (error: any) {
      logger.error(`Failed to resolve tenant for charge point ${chargePointId}:`, error.message);
      // Return default tenant (1) for backward compatibility
      return 1;
    }
  }

  /**
   * Clear cache for a charge point
   */
  clearCache(chargePointId: string): void {
    this.cache.delete(chargePointId);
    this.cacheTTL.delete(chargePointId);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
    this.cacheTTL.clear();
  }
}



