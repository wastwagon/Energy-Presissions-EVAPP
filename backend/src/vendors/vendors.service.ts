import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor, VendorStatus } from '../entities/vendor.entity';
import { VendorDisablement } from '../entities/vendor-disablement.entity';
import { VendorStatusService } from './vendor-status.service';

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(VendorDisablement)
    private disablementRepository: Repository<VendorDisablement>,
    private vendorStatusService: VendorStatusService,
  ) {}

  /**
   * Get all vendors
   */
  async findAll(): Promise<Vendor[]> {
    try {
      return await this.vendorRepository.find({
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error fetching all vendors: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get vendor by ID
   */
  async findOne(id: number): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({
      where: { id },
      // Removed relations to avoid potential circular dependency issues
      // Relations can be loaded separately if needed
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  /**
   * Get vendor by domain
   */
  async findByDomain(domain: string): Promise<Vendor | null> {
    return this.vendorRepository.findOne({
      where: { domain },
    });
  }

  /**
   * Create a new vendor
   */
  async create(createVendorDto: {
    name: string;
    slug?: string;
    domain?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    metadata?: Record<string, any>;
  }): Promise<Vendor> {
    // Check if domain already exists
    if (createVendorDto.domain) {
      const existing = await this.findByDomain(createVendorDto.domain);
      if (existing) {
        throw new BadRequestException(`Domain ${createVendorDto.domain} is already in use`);
      }
    }

    // Check if slug already exists
    if (createVendorDto.slug) {
      const existing = await this.vendorRepository.findOne({
        where: { slug: createVendorDto.slug } as any,
      });
      if (existing) {
        throw new BadRequestException(`Slug ${createVendorDto.slug} is already in use`);
      }
    }

    // Generate slug from name if not provided
    const slug = createVendorDto.slug || createVendorDto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const vendor = this.vendorRepository.create({
      name: createVendorDto.name,
      slug: slug,
      domain: createVendorDto.domain,
      contactEmail: createVendorDto.contactEmail,
      contactPhone: createVendorDto.contactPhone,
      address: createVendorDto.address,
      metadata: createVendorDto.metadata,
      status: 'active',
    });

    const saved = await this.vendorRepository.save(vendor);

    // Update cache
    await this.vendorStatusService.updateVendorStatus(saved.id, 'active');

    this.logger.log(`Created vendor: ${saved.id} - ${saved.name}`);
    return saved;
  }

  /**
   * Update vendor
   */
  async update(id: number, updateVendorDto: Partial<Vendor>): Promise<Vendor> {
    const vendor = await this.findOne(id);

    // If domain is being changed, check for conflicts
    if (updateVendorDto.domain && updateVendorDto.domain !== vendor.domain) {
      const existing = await this.findByDomain(updateVendorDto.domain);
      if (existing) {
        throw new BadRequestException(`Domain ${updateVendorDto.domain} is already in use`);
      }
    }

    Object.assign(vendor, updateVendorDto);
    return this.vendorRepository.save(vendor);
  }

  /**
   * Change vendor status
   */
  async changeStatus(
    vendorId: number,
    status: VendorStatus,
    reason: string,
    byUserId: number,
  ): Promise<{ ok: boolean; appliedAt: string }> {
    const vendor = await this.findOne(vendorId);

    if (vendor.status === status) {
      throw new BadRequestException(`Vendor is already ${status}`);
    }

    // Update vendor status
    vendor.status = status;
    await this.vendorRepository.save(vendor);

    // Create audit record
    const disablement = this.disablementRepository.create({
      vendorId,
      status,
      reason,
      byUserId,
      effectiveAt: new Date(),
    });
    await this.disablementRepository.save(disablement);

    // Update cache and propagate
    await this.vendorStatusService.updateVendorStatus(vendorId, status, reason);

    this.logger.log(`Vendor ${vendorId} status changed to ${status} by user ${byUserId}`);

    return {
      ok: true,
      appliedAt: new Date().toISOString(),
    };
  }

  /**
   * Get vendor status with audit history
   */
  async getStatus(vendorId: number): Promise<{
    status: VendorStatus;
    reason?: string;
    effectiveAt: Date;
    updatedBy?: number;
    history: VendorDisablement[];
  }> {
    const vendor = await this.findOne(vendorId);

    const history = await this.disablementRepository.find({
      where: { vendorId },
      order: { effectiveAt: 'DESC' },
      take: 10, // Last 10 status changes
      relations: ['byUser'],
    });

    const latest = history[0];

    return {
      status: vendor.status,
      reason: latest?.reason,
      effectiveAt: latest?.effectiveAt || vendor.updatedAt,
      updatedBy: latest?.byUserId,
      history,
    };
  }

  /**
   * Get disablement history for a vendor
   */
  async getDisablementHistory(vendorId: number): Promise<VendorDisablement[]> {
    return this.disablementRepository.find({
      where: { vendorId },
      order: { effectiveAt: 'DESC' },
      relations: ['byUser'],
    });
  }

  /**
   * Delete vendor (soft delete - set to disabled)
   */
  async delete(id: number, byUserId: number): Promise<void> {
    const vendor = await this.findOne(id);
    await this.changeStatus(id, 'disabled', 'Vendor deleted', byUserId);
  }

  /**
   * Login as vendor (Super Admin impersonation)
   * This allows a Super Admin to switch their session context to a specific vendor
   */
  async loginAsVendor(vendorId: number, adminUserId: number): Promise<{
    success: boolean;
    message: string;
    vendorId: number;
  }> {
    const vendor = await this.findOne(vendorId);

    // Check if vendor is active
    if (vendor.status !== 'active') {
      throw new BadRequestException(
        `Cannot login as vendor "${vendor.name}" - vendor status is ${vendor.status}. Only active vendors can be accessed.`,
      );
    }

    this.logger.log(`Super Admin ${adminUserId} logging in as vendor ${vendorId} (${vendor.name})`);

    // In a real implementation, you would:
    // 1. Update the user's session/token to include the vendor context
    // 2. Store the impersonation in a session table for audit
    // 3. Set a flag indicating this is an impersonated session
    // For now, we'll return success and let the frontend handle the context switch

    return {
      success: true,
      message: `Successfully logged in as vendor "${vendor.name}"`,
      vendorId: vendor.id,
    };
  }
}

