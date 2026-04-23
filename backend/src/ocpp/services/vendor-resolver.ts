import axios from 'axios';
import { logger } from '../utils/logger';

const CSMS_API_URL = process.env.CSMS_API_URL || 'http://csms-api:3000';
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || '';

interface ChargePointInfo {
  id: number;
  chargePointId: string;
  vendorId: number;
}

/**
 * Service to resolve vendorId from chargePointId
 * Caches results in memory for performance
 */
export class VendorResolver {
  private cache: Map<string, number> = new Map();
  private cacheTTL: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Resolve vendorId from chargePointId
   */
  async resolveVendorId(chargePointId: string): Promise<number | null> {
    // Check cache first
    const cached = this.cache.get(chargePointId);
    const cachedTime = this.cacheTTL.get(chargePointId);
    
    if (cached && cachedTime && Date.now() - cachedTime < this.CACHE_DURATION) {
      return cached;
    }

    try {
      // Query CSMS API for charge point info
      const response = await axios.get<ChargePointInfo>(
        `${CSMS_API_URL}/api/internal/charge-points/${chargePointId}/vendor`,
        {
          headers: {
            Authorization: `Bearer ${SERVICE_TOKEN}`,
          },
          timeout: 5000,
        },
      );

      const vendorId = response.data.vendorId;
      
      // Cache the result
      this.cache.set(chargePointId, vendorId);
      this.cacheTTL.set(chargePointId, Date.now());

      return vendorId;
    } catch (error: any) {
      logger.error(`Failed to resolve vendor for charge point ${chargePointId}:`, error.message);
      // Return default vendor (1) for backward compatibility
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

