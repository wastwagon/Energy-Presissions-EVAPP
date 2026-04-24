import axios from 'axios';
import { logger } from '../utils/logger';

const SERVICE_TOKEN = process.env.SERVICE_TOKEN || '';

function getCsmsBaseUrl(): string {
  const p = String(process.env.PORT || '3000');
  return (process.env.CSMS_API_URL || `http://127.0.0.1:${p}`).replace(/\/$/, '');
}

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
        `${getCsmsBaseUrl()}/api/internal/charge-points/${encodeURIComponent(chargePointId)}/vendor`,
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
    } catch (error: unknown) {
      // Do not pass a second `string` to winston — it is merged into `meta` and is JSON-stringified by character index.
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.info(
          `No charge point row for ${chargePointId} (internal /vendor 404) — using default vendor 1`,
        );
        return 1;
      }
      const detail = axios.isAxiosError(error)
        ? `${error.message} status=${error.response?.status ?? 'n/a'}`
        : (error as Error)?.message ?? String(error);
      logger.warn(`Failed to resolve vendor for ${chargePointId}: ${detail}`);
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

