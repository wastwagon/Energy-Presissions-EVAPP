import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../entities/tenant.entity';
import { TenantDisablement } from '../entities/tenant-disablement.entity';
import { TenantStatusService } from './tenant-status.service';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantDisablement)
    private disablementRepository: Repository<TenantDisablement>,
    private tenantStatusService: TenantStatusService,
  ) {}

  /**
   * Get all tenants
   */
  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get tenant by ID
   */
  async findOne(id: number): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['chargePoints', 'users'],
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  /**
   * Get tenant by domain
   */
  async findByDomain(domain: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { domain },
    });
  }

  /**
   * Create a new tenant
   */
  async create(createTenantDto: {
    name: string;
    slug?: string;
    domain?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    metadata?: Record<string, any>;
  }): Promise<Tenant> {
    // Check if domain already exists
    if (createTenantDto.domain) {
      const existing = await this.findByDomain(createTenantDto.domain);
      if (existing) {
        throw new BadRequestException(`Domain ${createTenantDto.domain} is already in use`);
      }
    }

    // Check if slug already exists
    if (createTenantDto.slug) {
      const existing = await this.tenantRepository.findOne({
        where: { slug: createTenantDto.slug } as any,
      });
      if (existing) {
        throw new BadRequestException(`Slug ${createTenantDto.slug} is already in use`);
      }
    }

    // Generate slug from name if not provided
    const slug = createTenantDto.slug || createTenantDto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const tenant = this.tenantRepository.create({
      name: createTenantDto.name,
      slug: slug,
      domain: createTenantDto.domain,
      contactEmail: createTenantDto.contactEmail,
      contactPhone: createTenantDto.contactPhone,
      address: createTenantDto.address,
      metadata: createTenantDto.metadata,
      status: 'active',
    });

    const saved = await this.tenantRepository.save(tenant);

    // Update cache
    await this.tenantStatusService.updateTenantStatus(saved.id, 'active');

    this.logger.log(`Created tenant: ${saved.id} - ${saved.name}`);
    return saved;
  }

  /**
   * Update tenant
   */
  async update(id: number, updateTenantDto: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.findOne(id);

    // If domain is being changed, check for conflicts
    if (updateTenantDto.domain && updateTenantDto.domain !== tenant.domain) {
      const existing = await this.findByDomain(updateTenantDto.domain);
      if (existing) {
        throw new BadRequestException(`Domain ${updateTenantDto.domain} is already in use`);
      }
    }

    Object.assign(tenant, updateTenantDto);
    return this.tenantRepository.save(tenant);
  }

  /**
   * Change tenant status
   */
  async changeStatus(
    tenantId: number,
    status: TenantStatus,
    reason: string,
    byUserId: number,
  ): Promise<{ ok: boolean; appliedAt: string }> {
    const tenant = await this.findOne(tenantId);

    if (tenant.status === status) {
      throw new BadRequestException(`Tenant is already ${status}`);
    }

    // Update tenant status
    tenant.status = status;
    await this.tenantRepository.save(tenant);

    // Create audit record
    const disablement = this.disablementRepository.create({
      tenantId,
      status,
      reason,
      byUserId,
      effectiveAt: new Date(),
    });
    await this.disablementRepository.save(disablement);

    // Update cache and propagate
    await this.tenantStatusService.updateTenantStatus(tenantId, status, reason);

    this.logger.log(`Tenant ${tenantId} status changed to ${status} by user ${byUserId}`);

    return {
      ok: true,
      appliedAt: new Date().toISOString(),
    };
  }

  /**
   * Get tenant status with audit history
   */
  async getStatus(tenantId: number): Promise<{
    status: TenantStatus;
    reason?: string;
    effectiveAt: Date;
    updatedBy?: number;
    history: TenantDisablement[];
  }> {
    const tenant = await this.findOne(tenantId);

    const history = await this.disablementRepository.find({
      where: { tenantId },
      order: { effectiveAt: 'DESC' },
      take: 10, // Last 10 status changes
      relations: ['byUser'],
    });

    const latest = history[0];

    return {
      status: tenant.status,
      reason: latest?.reason,
      effectiveAt: latest?.effectiveAt || tenant.updatedAt,
      updatedBy: latest?.byUserId,
      history,
    };
  }

  /**
   * Get disablement history for a tenant
   */
  async getDisablementHistory(tenantId: number): Promise<TenantDisablement[]> {
    return this.disablementRepository.find({
      where: { tenantId },
      order: { effectiveAt: 'DESC' },
      relations: ['byUser'],
    });
  }

  /**
   * Delete tenant (soft delete - set to disabled)
   */
  async delete(id: number, byUserId: number): Promise<void> {
    const tenant = await this.findOne(id);
    await this.changeStatus(id, 'disabled', 'Tenant deleted', byUserId);
  }

  /**
   * Login as tenant (Super Admin impersonation)
   * This allows a Super Admin to switch their session context to a specific tenant
   */
  async loginAsTenant(tenantId: number, adminUserId: number): Promise<{
    success: boolean;
    message: string;
    tenantId: number;
  }> {
    const tenant = await this.findOne(tenantId);

    // Check if tenant is active
    if (tenant.status !== 'active') {
      throw new BadRequestException(
        `Cannot login as tenant "${tenant.name}" - tenant status is ${tenant.status}. Only active tenants can be accessed.`,
      );
    }

    this.logger.log(`Super Admin ${adminUserId} logging in as tenant ${tenantId} (${tenant.name})`);

    // In a real implementation, you would:
    // 1. Update the user's session/token to include the tenant context
    // 2. Store the impersonation in a session table for audit
    // 3. Set a flag indicating this is an impersonated session
    // For now, we'll return success and let the frontend handle the context switch

    return {
      success: true,
      message: `Successfully logged in as tenant "${tenant.name}"`,
      tenantId: tenant.id,
    };
  }
}

