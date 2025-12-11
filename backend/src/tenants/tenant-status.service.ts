import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../entities/tenant.entity';

@Injectable()
export class TenantStatusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TenantStatusService.name);
  private redis: Redis | null = null;
  private redisSubscriber: Redis | null = null;
  private inMemoryCache: Map<number, TenantStatus> = new Map();
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly PUBSUB_CHANNEL = 'tenant.status.changed';
  private redisEnabled = false;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
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
        // Subscribe to tenant status changes
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

    // Warm up cache with all tenant statuses (non-blocking)
    // This will fail gracefully if database tables don't exist yet
    this.warmUpCache().catch((error) => {
      this.logger.warn(`Cache warm-up failed: ${error.message}`);
    });

    this.logger.log('TenantStatusService initialized');
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
   * Get tenant status from cache (Redis) or database
   */
  async getTenantStatus(tenantId: number): Promise<TenantStatus> {
    // Check in-memory cache first
    if (this.inMemoryCache.has(tenantId)) {
      return this.inMemoryCache.get(tenantId)!;
    }

    // Check Redis cache (if available)
    if (this.redisEnabled && this.redis) {
      try {
        const cached = await this.redis.get(`tenant:${tenantId}:status`);
        if (cached) {
          const status = cached as TenantStatus;
          this.inMemoryCache.set(tenantId, status);
          return status;
        }
      } catch (error) {
        this.logger.warn(`Redis get error: ${error.message}. Falling back to database.`);
      }
    }

    // Fallback to database
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      select: ['id', 'status'],
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Cache the result
    await this.setTenantStatusCache(tenantId, tenant.status);
    return tenant.status;
  }

  /**
   * Set tenant status in cache
   */
  private async setTenantStatusCache(tenantId: number, status: TenantStatus): Promise<void> {
    // Always update in-memory cache
    this.inMemoryCache.set(tenantId, status);
    
    // Update Redis cache if available
    if (this.redisEnabled && this.redis) {
      try {
        await this.redis.setex(`tenant:${tenantId}:status`, this.CACHE_TTL, status);
      } catch (error) {
        this.logger.warn(`Redis setex error: ${error.message}. Using in-memory cache only.`);
      }
    }
  }

  /**
   * Update tenant status and propagate changes
   */
  async updateTenantStatus(
    tenantId: number,
    status: TenantStatus,
    reason?: string,
  ): Promise<void> {
    // Update database
    await this.tenantRepository.update(tenantId, { status });

    // Update cache
    await this.setTenantStatusCache(tenantId, status);

    // Revoke all tenant tokens
    await this.revokeTenantTokens(tenantId);

    // Publish status change event
    await this.publishStatusChange({
      tenantId,
      status,
      reason,
      at: new Date().toISOString(),
    });

    this.logger.log(`Tenant ${tenantId} status changed to ${status}`);
  }

  /**
   * Revoke all tokens for a tenant
   */
  private async revokeTenantTokens(tenantId: number): Promise<void> {
    if (this.redisEnabled && this.redis) {
      try {
        const tokenRevocationKey = `tenant:${tenantId}:tokens:revoked`;
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
   * Check if tenant token is revoked
   */
  async isTokenRevoked(tenantId: number): Promise<boolean> {
    if (this.redisEnabled && this.redis) {
      try {
        const tokenRevocationKey = `tenant:${tenantId}:tokens:revoked`;
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
   * Publish tenant status change event
   */
  private async publishStatusChange(payload: {
    tenantId: number;
    status: TenantStatus;
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
    tenantId: number;
    status: TenantStatus;
    reason?: string;
    at: string;
  }): void {
    this.inMemoryCache.set(payload.tenantId, payload.status);
    this.logger.log(
      `Received status change for tenant ${payload.tenantId}: ${payload.status}`,
    );
  }

  /**
   * Warm up cache with all tenant statuses
   */
  private async warmUpCache(): Promise<void> {
    try {
      const tenants = await this.tenantRepository.find({
        select: ['id', 'status'],
      });

      for (const tenant of tenants) {
        await this.setTenantStatusCache(tenant.id, tenant.status);
      }

      this.logger.log(`Warmed up cache with ${tenants.length} tenants`);
    } catch (error) {
      // Handle case where database tables don't exist yet (migrations not run)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        this.logger.warn('Tenants table does not exist yet. Cache warm-up skipped. Run database migrations first.');
      } else {
        this.logger.error(`Failed to warm up cache: ${error.message}`);
      }
      // Don't throw - allow app to start even if cache warm-up fails
    }
  }

  /**
   * Check if tenant is active
   */
  async isTenantActive(tenantId: number): Promise<boolean> {
    const status = await this.getTenantStatus(tenantId);
    return status === 'active';
  }

  /**
   * Check if tenant is suspended
   */
  async isTenantSuspended(tenantId: number): Promise<boolean> {
    const status = await this.getTenantStatus(tenantId);
    return status === 'suspended';
  }

  /**
   * Check if tenant is disabled
   */
  async isTenantDisabled(tenantId: number): Promise<boolean> {
    const status = await this.getTenantStatus(tenantId);
    return status === 'disabled';
  }
}



