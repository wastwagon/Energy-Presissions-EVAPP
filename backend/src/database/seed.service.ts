import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';

/** Default bcrypt password for bootstrap accounts when first created only (never rotated on restart). */
const BOOTSTRAP_ADMIN_PASSWORD = 'admin123';
const BOOTSTRAP_WALKIN_PASSWORD = 'walkin123';
const DEMO_CUSTOMER_PASSWORD = 'customer123';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private seedVendorId(): number {
    const raw = this.config.get<string>('DEFAULT_CUSTOMER_VENDOR_ID');
    if (raw != null && String(raw).trim() !== '') {
      const n = parseInt(String(raw).trim(), 10);
      if (Number.isFinite(n) && n > 0) {
        return n;
      }
    }
    return 1;
  }

  private bootstrapSeedDisabled(): boolean {
    const v = String(this.config.get<string>('SEED_BOOTSTRAP_USERS') ?? '').toLowerCase();
    return v === 'false' || v === '0' || v === 'no';
  }

  async onModuleInit() {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';

    if (isProd && this.bootstrapSeedDisabled()) {
      this.logger.log(
        'SEED_BOOTSTRAP_USERS disables default SuperAdmin/vendor Admin bootstrap (production).',
      );
    } else {
      if (isProd) {
        this.logger.warn(
          'Ensuring bootstrap staff users (SuperAdmin + vendor admins + walk-in). Set SEED_BOOTSTRAP_USERS=false after onboarding real accounts; change passwords in the app.',
        );
      }
      await this.seedBootstrapStaffUsers();
    }

    const forceDevSeed = this.config.get<string>('ENABLE_DEV_SEED') === 'true';
    const seedDemoCustomers = !isProd || forceDevSeed;

    if (seedDemoCustomers) {
      await this.seedDemoCustomerUsers();
    }
  }

  /** SuperAdmin, walk-in, vendor-scoped admins — runs in production unless SEED_BOOTSTRAP_USERS=false. Idempotent (create-if-missing only). */
  async seedBootstrapStaffUsers() {
    try {
      const vid = this.seedVendorId();

      await this.ensureUser({
        email: 'admin@evcharging.com',
        create: async () =>
          this.userRepository.create({
            email: 'admin@evcharging.com',
            passwordHash: await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 10),
            firstName: 'System',
            lastName: 'Administrator',
            phone: '+233000000000',
            accountType: 'SuperAdmin',
            balance: 0,
            currency: 'GHS',
            status: 'Active',
            emailVerified: true,
            vendorId: vid,
          }),
      });

      await this.ensureUser({
        email: 'walkin@evcharging.com',
        create: async () =>
          this.userRepository.create({
            email: 'walkin@evcharging.com',
            passwordHash: await bcrypt.hash(BOOTSTRAP_WALKIN_PASSWORD, 10),
            firstName: 'Walk-In',
            lastName: 'Customer',
            accountType: 'WalkIn',
            balance: 0,
            currency: 'GHS',
            status: 'Active',
            emailVerified: false,
            vendorId: vid,
          }),
      });

      const admins = [
        { email: 'admin1@vendor1.com', firstName: 'Vendor', lastName: 'Admin One' },
        { email: 'admin2@vendor1.com', firstName: 'Vendor', lastName: 'Admin Two' },
      ];

      for (const adminData of admins) {
        await this.ensureUser({
          email: adminData.email,
          create: async () =>
            this.userRepository.create({
              email: adminData.email,
              passwordHash: await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 10),
              firstName: adminData.firstName,
              lastName: adminData.lastName,
              accountType: 'Admin',
              balance: 0,
              currency: 'GHS',
              status: 'Active',
              emailVerified: true,
              vendorId: vid,
            }),
        });
      }

      this.logger.log(
        `Bootstrap staff ready (vendor_id=${vid}). SuperAdmin: admin@evcharging.com; vendor admins: admin1@vendor1.com, admin2@vendor1.com — initial password "${BOOTSTRAP_ADMIN_PASSWORD}" on first create only.`,
      );
    } catch (error) {
      this.logger.error('Error seeding bootstrap staff users:', error);
    }
  }

  private async ensureUser(opts: {
    email: string;
    create: () => Promise<User>;
  }): Promise<void> {
    const existing = await this.userRepository.findOne({ where: { email: opts.email } });
    if (existing) {
      this.logger.debug(`User already exists: ${opts.email}`);
      return;
    }
    const entity = await opts.create();
    await this.userRepository.save(entity);
    this.logger.log(`Created bootstrap user: ${opts.email}`);
  }

  /** Demo customer accounts — dev by default; production only if ENABLE_DEV_SEED=true */
  async seedDemoCustomerUsers() {
    try {
      const vid = this.seedVendorId();

      const customerUsers = [
        { email: 'customer1@vendor1.com', firstName: 'John', lastName: 'Doe', balance: 100.0 },
        { email: 'customer2@vendor1.com', firstName: 'Jane', lastName: 'Smith', balance: 50.0 },
        { email: 'customer3@vendor1.com', firstName: 'Bob', lastName: 'Johnson', balance: 0.0 },
      ];

      for (const customerData of customerUsers) {
        await this.ensureUser({
          email: customerData.email,
          create: async () =>
            this.userRepository.create({
              email: customerData.email,
              passwordHash: await bcrypt.hash(DEMO_CUSTOMER_PASSWORD, 10),
              firstName: customerData.firstName,
              lastName: customerData.lastName,
              accountType: 'Customer',
              balance: customerData.balance,
              currency: 'GHS',
              status: 'Active',
              emailVerified: true,
              vendorId: vid,
            }),
        });
      }

      this.logger.log(`Demo customer seed checked (password ${DEMO_CUSTOMER_PASSWORD} on first create only).`);
    } catch (error) {
      this.logger.error('Error seeding demo customer users:', error);
    }
  }
}
