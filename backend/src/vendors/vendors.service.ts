import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Vendor, VendorStatus } from '../entities/vendor.entity';
import { VendorDisablement } from '../entities/vendor-disablement.entity';
import { User } from '../entities/user.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { Transaction } from '../entities/transaction.entity';
import { VendorStatusService } from './vendor-status.service';
import { StorageService } from '../storage/storage.service';

const MIN_VENDOR_ADMIN_PASSWORD_LENGTH = 8;

export type VendorPortalAdminInfo = {
  userId: number | null;
  email: string | null;
};

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(VendorDisablement)
    private disablementRepository: Repository<VendorDisablement>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ChargePoint)
    private chargePointRepository: Repository<ChargePoint>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private vendorStatusService: VendorStatusService,
    private readonly storageService: StorageService,
  ) {}

  private assertPasswordStrength(password: string): void {
    if (!password || password.length < MIN_VENDOR_ADMIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${MIN_VENDOR_ADMIN_PASSWORD_LENGTH} characters`,
      );
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async findPrimaryPortalAdmin(vendorId: number): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.vendor_id = :vendorId', { vendorId })
      .andWhere('user.account_type = :accountType', { accountType: 'Admin' })
      .orderBy('user.created_at', 'ASC')
      .getOne();
  }

  async getPortalAdmin(vendorId: number): Promise<VendorPortalAdminInfo> {
    await this.findOne(vendorId);
    const admin = await this.findPrimaryPortalAdmin(vendorId);
    return {
      userId: admin?.id ?? null,
      email: admin?.email ?? null,
    };
  }

  private async ensureEmailAvailable(email: string, exceptUserId?: number): Promise<void> {
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing && existing.id !== exceptUserId) {
      throw new ConflictException(`Email ${email} is already in use`);
    }
  }

  private resolveAdminEmail(adminEmail: string | undefined, contactEmail: string | undefined): string {
    const raw = (adminEmail || contactEmail || '').trim();
    if (!raw) {
      throw new BadRequestException('Vendor admin login email is required');
    }
    return this.normalizeEmail(raw);
  }

  private async createPortalAdminUser(
    vendorId: number,
    email: string,
    password: string,
    vendorName: string,
  ): Promise<User> {
    this.assertPasswordStrength(password);
    await this.ensureEmailAvailable(email);

    const user = this.userRepository.create({
      email,
      passwordHash: await bcrypt.hash(password, 10),
      firstName: vendorName,
      lastName: 'Admin',
      accountType: 'Admin',
      balance: 0,
      currency: 'GHS',
      status: 'Active',
      emailVerified: true,
      vendorId,
    });

    const saved = await this.userRepository.save(user);
    this.logger.log(`Created vendor portal admin user ${saved.id} for vendor ${vendorId}`);
    return saved;
  }

  private async upsertPortalAdminPassword(
    vendor: Vendor,
    adminEmail: string | undefined,
    adminPassword: string | undefined,
  ): Promise<void> {
    if (!adminPassword?.trim()) {
      return;
    }

    this.assertPasswordStrength(adminPassword);
    const admin = await this.findPrimaryPortalAdmin(vendor.id);

    if (admin) {
      admin.passwordHash = await bcrypt.hash(adminPassword, 10);
      admin.passwordResetToken = null;
      admin.passwordResetExpiresAt = null;
      await this.userRepository.save(admin);
      this.logger.log(`Updated portal admin password for vendor ${vendor.id} (user ${admin.id})`);
      return;
    }

    const email = this.resolveAdminEmail(adminEmail, vendor.contactEmail);
    await this.createPortalAdminUser(vendor.id, email, adminPassword, vendor.name);
  }

  private async updatePortalAdminEmail(vendor: Vendor, adminEmail: string | undefined): Promise<void> {
    if (!adminEmail?.trim()) {
      return;
    }

    const email = this.normalizeEmail(adminEmail);
    const admin = await this.findPrimaryPortalAdmin(vendor.id);
    if (!admin) {
      return;
    }

    if (admin.email === email) {
      return;
    }

    await this.ensureEmailAvailable(email, admin.id);
    admin.email = email;
    await this.userRepository.save(admin);
    this.logger.log(`Updated portal admin email for vendor ${vendor.id} (user ${admin.id})`);
  }

  /**
   * Get all vendors, with station count, last session, and completed-session sales (gmv).
   */
  async findAll(): Promise<Vendor[]> {
    try {
      const vendors = await this.vendorRepository.find({
        order: { createdAt: 'DESC' },
      });
      if (vendors.length === 0) return vendors;

      const stationRows: Array<{ vendorId: string | number; stationCount: string | number }> =
        await this.chargePointRepository
          .createQueryBuilder('cp')
          .select('cp.vendor_id', 'vendorId')
          .addSelect('COUNT(cp.id)', 'stationCount')
          .groupBy('cp.vendor_id')
          .getRawMany();

      const sessionRows: Array<{
        vendorId: string | number;
        lastSessionAt: Date | string | null;
        gmv: string | number;
      }> = await this.transactionRepository
        .createQueryBuilder('t')
        .innerJoin(ChargePoint, 'cp', 'cp.charge_point_id = t.charge_point_id')
        .select('cp.vendor_id', 'vendorId')
        .addSelect('MAX(t.start_time)', 'lastSessionAt')
        .addSelect(
          `COALESCE(SUM(CASE WHEN t.status = 'Completed' THEN t.total_cost ELSE 0 END), 0)`,
          'gmv',
        )
        .groupBy('cp.vendor_id')
        .getRawMany();

      const stationCount = new Map<number, number>();
      for (const row of stationRows) {
        stationCount.set(Number(row.vendorId), Number(row.stationCount) || 0);
      }
      const sessionStats = new Map<number, { lastSessionAt: Date | string | null; gmv: number }>();
      for (const row of sessionRows) {
        sessionStats.set(Number(row.vendorId), {
          lastSessionAt: row.lastSessionAt ?? null,
          gmv: Number(row.gmv) || 0,
        });
      }

      for (const vendor of vendors) {
        const stats = sessionStats.get(vendor.id);
        (vendor as Vendor & { stationCount: number; lastSessionAt: Date | string | null; gmv: number }).stationCount =
          stationCount.get(vendor.id) ?? 0;
        (vendor as Vendor & { lastSessionAt: Date | string | null }).lastSessionAt = stats?.lastSessionAt ?? null;
        (vendor as Vendor & { gmv: number }).gmv = stats?.gmv ?? 0;
      }

      return vendors;
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
    adminEmail?: string;
    adminPassword: string;
    payoutCycle?: 'weekly' | 'biweekly' | 'monthly';
    payoutHoldDays?: number;
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
      payoutCycle: createVendorDto.payoutCycle === 'weekly' || createVendorDto.payoutCycle === 'biweekly'
        ? createVendorDto.payoutCycle
        : 'monthly',
      payoutHoldDays:
        typeof createVendorDto.payoutHoldDays === 'number' &&
        createVendorDto.payoutHoldDays >= 0 &&
        createVendorDto.payoutHoldDays <= 90
          ? Math.round(createVendorDto.payoutHoldDays)
          : 7,
    });

    const saved = await this.vendorRepository.save(vendor);

    const adminEmail = this.resolveAdminEmail(
      createVendorDto.adminEmail,
      createVendorDto.contactEmail,
    );
    await this.createPortalAdminUser(
      saved.id,
      adminEmail,
      createVendorDto.adminPassword,
      saved.name,
    );

    // Update cache
    await this.vendorStatusService.updateVendorStatus(saved.id, 'active');

    this.logger.log(`Created vendor: ${saved.id} - ${saved.name}`);
    return saved;
  }

  /**
   * Update vendor
   */
  async update(
    id: number,
    updateVendorDto: Partial<Vendor>,
    portalAdmin?: { adminEmail?: string; adminPassword?: string },
  ): Promise<Vendor> {
    const vendor = await this.findOne(id);

    // If domain is being changed, check for conflicts
    if (updateVendorDto.domain && updateVendorDto.domain !== vendor.domain) {
      const existing = await this.findByDomain(updateVendorDto.domain);
      if (existing) {
        throw new BadRequestException(`Domain ${updateVendorDto.domain} is already in use`);
      }
    }

    Object.assign(vendor, updateVendorDto);
    const saved = await this.vendorRepository.save(vendor);

    if (portalAdmin?.adminEmail) {
      await this.updatePortalAdminEmail(saved, portalAdmin.adminEmail);
    }
    if (portalAdmin?.adminPassword) {
      await this.upsertPortalAdminPassword(
        saved,
        portalAdmin.adminEmail,
        portalAdmin.adminPassword,
      );
    }

    return saved;
  }

  /**
   * Upload logo to object storage and set vendors.logo_url (replaces previous stored object when possible).
   */
  async uploadLogo(
    id: number,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<Vendor> {
    const vendor = await this.findOne(id);
    const previousUrl = vendor.logoUrl;
    const newUrl = await this.storageService.uploadVendorLogo(id, buffer, originalName, mimeType);
    vendor.logoUrl = newUrl;
    const saved = await this.vendorRepository.save(vendor);
    const oldKey = previousUrl ? this.storageService.parseObjectKeyFromStoredPath(previousUrl) : null;
    const newKey = this.storageService.parseObjectKeyFromStoredPath(newUrl);
    if (oldKey && oldKey !== newKey) {
      try {
        await this.storageService.removeObjectIfKey(oldKey);
      } catch (e: any) {
        this.logger.warn(`Could not remove previous vendor logo: ${e?.message || e}`);
      }
    }
    return saved;
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
    await this.findOne(id);
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

