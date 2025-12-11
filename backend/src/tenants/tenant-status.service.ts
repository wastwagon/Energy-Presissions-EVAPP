import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../entities/tenant.entity';

@Injectable()
export class TenantStatusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TenantStatusService.name);
  private redis: Redis;
  private redisSubscriber: Redis;
  private inMemoryCache: Map<number, TenantStatus> = new Map();
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly PUBSUB_CHANNEL = 'tenant.status.changed';

  constructor(
    private configService: ConfigService,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://redis:6379';
    this.redis = new Redis(redisUrl);
    this.redisSubscriber = new Redis(redisUrl);
  }

  async onModuleInit() {
    // Subscribe to tenant status changes
    await this.redisSubscriber.subscribe(this.PUBSUB_CHANNEL);
    this.redisSubscriber.on('message', (channel, message) => {
      if (channel === this.PUBSUB_CHANNEL) {
        this.handleStatusChange(JSON.parse(message));
      }
    });

    // Warm up cache with all tenant statuses
    await this.warmUpCache();

    this.logger.log('TenantStatusService initialized');
  }

  async onModuleDestroy() {
    await this.redisSubscriber.unsubscribe(this.PUBSUB_CHANNEL);
    await this.redisSubscriber.quit();
    await this.redis.quit();
  }

  /**
   * Get tenant status from cache (Redis) or database
   */
  async getTenantStatus(tenantId: number): Promise<TenantStatus> {
    // Check in-memory cache first
    if (this.inMemoryCache.has(tenantId)) {
      return this.inMemoryCache.get(tenantId)!;
    }

    // Check Redis cache
    const cached = await this.redis.get(`tenant:${tenantId}:status`);
    if (cached) {
      const status = cached as TenantStatus;
      this.inMemoryCache.set(tenantId, status);
      return status;
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
    await this.redis.setex(`tenant:${tenantId}:status`, this.CACHE_TTL, status);
    this.inMemoryCache.set(tenantId, status);
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
    const tokenRevocationKey = `tenant:${tenantId}:tokens:revoked`;
    const maxTokenLifetime = 86400; // 24 hours
    await this.redis.setex(tokenRevocationKey, maxTokenLifetime, Date.now().toString());
  }

  /**
   * Check if tenant token is revoked
   */
  async isTokenRevoked(tenantId: number): Promise<boolean> {
    const tokenRevocationKey = `tenant:${tenantId}:tokens:revoked`;
    const revoked = await this.redis.exists(tokenRevocationKey);
    return revoked === 1;
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
    await this.redis.publish(this.PUBSUB_CHANNEL, JSON.stringify(payload));
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
    const tenants = await this.tenantRepository.find({
      select: ['id', 'status'],
    });

    for (const tenant of tenants) {
      await this.setTenantStatusCache(tenant.id, tenant.status);
    }

    this.logger.log(`Warmed up cache with ${tenants.length} tenants`);
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



