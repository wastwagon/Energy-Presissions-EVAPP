import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor, VendorStatus } from '../entities/vendor.entity';

@Injectable()
export class VendorStatusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VendorStatusService.name);
  private redis: Redis | null = null;
  private redisSubscriber: Redis | null = null;
  private inMemoryCache: Map<number, VendorStatus> = new Map();
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly PUBSUB_CHANNEL = 'vendor.status.changed';
  private redisEnabled = false;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    // Only initialize Redis if URL is provided and not localhost (for production)
    if (redisUrl && !redisUrl.includes('localhost') && !redisUrl.includes('127.0.0.1')) {
      try {
        this.redis = new Redis(redisUrl, {
          retryStrategy: () => null, // Disable retries to fail fast
          maxRetriesPerRequest: null, // Disable per-request retries
          enableOfflineQueue: false, // Don't queue commands when offline
        });
        this.redisSubscriber = new Redis(redisUrl, {
          retryStrategy: () => null,
          maxRetriesPerRequest: null,
          enableOfflineQueue: false,
        });
        
        // Handle connection errors gracefully
        this.redis.on('error', (err) => {
          this.logger.warn(`Redis connection error: ${err.message}. Falling back to in-memory cache.`);
          this.redisEnabled = false;
        });
        
        this.redisSubscriber.on('error', (err) => {
          this.logger.warn(`Redis subscriber error: ${err.message}. Pub/sub disabled.`);
        });
        
        this.redisEnabled = true;
        this.logger.log('Redis initialized successfully');
      } catch (error) {
        this.logger.warn(`Failed to initialize Redis: ${error.message}. Using in-memory cache only.`);
        this.redisEnabled = false;
      }
    } else {
      this.logger.log('Redis not configured. Using in-memory cache only.');
      this.redisEnabled = false;
    }
  }

  async onModuleInit() {
    if (this.redisEnabled && this.redisSubscriber) {
      try {
        // Subscribe to vendor status changes
        await this.redisSubscriber.subscribe(this.PUBSUB_CHANNEL);
        this.redisSubscriber.on('message', (channel, message) => {
          if (channel === this.PUBSUB_CHANNEL) {
            this.handleStatusChange(JSON.parse(message));
          }
        });
      } catch (error) {
        this.logger.warn(`Failed to subscribe to Redis channel: ${error.message}`);
        this.redisEnabled = false;
      }
    }

    // Warm up cache with all vendor statuses (non-blocking)
    // This will fail gracefully if database tables don't exist yet
    this.warmUpCache().catch((error) => {
      this.logger.warn(`Cache warm-up failed: ${error.message}`);
    });

    this.logger.log('VendorStatusService initialized');
  }

  async onModuleDestroy() {
    if (this.redisSubscriber) {
      try {
        await this.redisSubscriber.unsubscribe(this.PUBSUB_CHANNEL);
        await this.redisSubscriber.quit();
      } catch (error) {
        this.logger.warn(`Error closing Redis subscriber: ${error.message}`);
      }
    }
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (error) {
        this.logger.warn(`Error closing Redis connection: ${error.message}`);
      }
    }
  }

  /**
   * Get vendor status from cache (Redis) or database
   */
  async getVendorStatus(vendorId: number): Promise<VendorStatus> {
    // Check in-memory cache first
    if (this.inMemoryCache.has(vendorId)) {
      return this.inMemoryCache.get(vendorId)!;
    }

    // Check Redis cache (if available)
    if (this.redisEnabled && this.redis) {
      try {
        const cached = await this.redis.get(`vendor:${vendorId}:status`);
        if (cached) {
          const status = cached as VendorStatus;
          this.inMemoryCache.set(vendorId, status);
          return status;
        }
      } catch (error) {
        this.logger.warn(`Redis get error: ${error.message}. Falling back to database.`);
      }
    }

    // Fallback to database
    const vendor = await this.vendorRepository.findOne({
      where: { id: vendorId },
      select: ['id', 'status'],
    });

    if (!vendor) {
      throw new Error(`Vendor ${vendorId} not found`);
    }

    // Cache the result
    await this.setVendorStatusCache(vendorId, vendor.status);
    return vendor.status;
  }

  /**
   * Set vendor status in cache
   */
  private async setVendorStatusCache(vendorId: number, status: VendorStatus): Promise<void> {
    // Always update in-memory cache
    this.inMemoryCache.set(vendorId, status);
    
    // Update Redis cache if available
    if (this.redisEnabled && this.redis) {
      try {
        await this.redis.setex(`vendor:${vendorId}:status`, this.CACHE_TTL, status);
      } catch (error) {
        this.logger.warn(`Redis setex error: ${error.message}. Using in-memory cache only.`);
      }
    }
  }

  /**
   * Update vendor status and propagate changes
   */
  async updateVendorStatus(
    vendorId: number,
    status: VendorStatus,
    reason?: string,
  ): Promise<void> {
    // Update database
    await this.vendorRepository.update(vendorId, { status });

    // Update cache
    await this.setVendorStatusCache(vendorId, status);

    // Revoke all vendor tokens
    await this.revokeVendorTokens(vendorId);

    // Publish status change event
    await this.publishStatusChange({
      vendorId,
      status,
      reason,
      at: new Date().toISOString(),
    });

    this.logger.log(`Vendor ${vendorId} status changed to ${status}`);
  }

  /**
   * Revoke all tokens for a vendor
   */
  private async revokeVendorTokens(vendorId: number): Promise<void> {
    if (this.redisEnabled && this.redis) {
      try {
        const tokenRevocationKey = `vendor:${vendorId}:tokens:revoked`;
        const maxTokenLifetime = 86400; // 24 hours
        await this.redis.setex(tokenRevocationKey, maxTokenLifetime, Date.now().toString());
      } catch (error) {
        this.logger.warn(`Redis token revocation error: ${error.message}`);
      }
    }
    // Note: Without Redis, token revocation won't work across instances
    // This is acceptable for single-instance deployments
  }

  /**
   * Check if vendor token is revoked
   */
  async isTokenRevoked(vendorId: number): Promise<boolean> {
    if (this.redisEnabled && this.redis) {
      try {
        const tokenRevocationKey = `vendor:${vendorId}:tokens:revoked`;
        const revoked = await this.redis.exists(tokenRevocationKey);
        return revoked === 1;
      } catch (error) {
        this.logger.warn(`Redis token check error: ${error.message}`);
        return false; // If Redis fails, assume token is not revoked
      }
    }
    return false; // Without Redis, we can't check revocation
  }

  /**
   * Publish vendor status change event
   */
  private async publishStatusChange(payload: {
    vendorId: number;
    status: VendorStatus;
    reason?: string;
    at: string;
  }): Promise<void> {
    if (this.redisEnabled && this.redis) {
      try {
        await this.redis.publish(this.PUBSUB_CHANNEL, JSON.stringify(payload));
      } catch (error) {
        this.logger.warn(`Redis publish error: ${error.message}`);
      }
    }
    // Note: Without Redis pub/sub, status changes won't propagate to other instances
    // This is acceptable for single-instance deployments
  }

  /**
   * Handle status change event from pub/sub
   */
  private handleStatusChange(payload: {
    vendorId: number;
    status: VendorStatus;
    reason?: string;
    at: string;
  }): void {
    this.inMemoryCache.set(payload.vendorId, payload.status);
    this.logger.log(
      `Received status change for vendor ${payload.vendorId}: ${payload.status}`,
    );
  }

  /**
   * Warm up cache with all vendor statuses
   */
  private async warmUpCache(): Promise<void> {
    try {
      const vendors = await this.vendorRepository.find({
        select: ['id', 'status'],
      });

      for (const vendor of vendors) {
        await this.setVendorStatusCache(vendor.id, vendor.status);
      }

      this.logger.log(`Warmed up cache with ${vendors.length} vendors`);
    } catch (error) {
      // Handle case where database tables don't exist yet (migrations not run)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        this.logger.warn('Vendors table does not exist yet. Cache warm-up skipped. Run database migrations first.');
      } else {
        this.logger.error(`Failed to warm up cache: ${error.message}`);
      }
      // Don't throw - allow app to start even if cache warm-up fails
    }
  }

  /**
   * Check if vendor is active
   */
  async isVendorActive(vendorId: number): Promise<boolean> {
    const status = await this.getVendorStatus(vendorId);
    return status === 'active';
  }

  /**
   * Check if vendor is suspended
   */
  async isVendorSuspended(vendorId: number): Promise<boolean> {
    const status = await this.getVendorStatus(vendorId);
    return status === 'suspended';
  }

  /**
   * Check if vendor is disabled
   */
  async isVendorDisabled(vendorId: number): Promise<boolean> {
    const status = await this.getVendorStatus(vendorId);
    return status === 'disabled';
  }
}

