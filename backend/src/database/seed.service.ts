import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Vendor } from '../entities/vendor.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultUsers();
  }

  async seedDefaultUsers() {
    try {
      // Check if default admin user exists
      let adminUser = await this.userRepository.findOne({
        where: { email: 'admin@evcharging.com' },
      });

      if (!adminUser) {
        const adminPasswordHash = await bcrypt.hash('admin123', 10);
        adminUser = this.userRepository.create({
          email: 'admin@evcharging.com',
          passwordHash: adminPasswordHash,
          firstName: 'System',
          lastName: 'Administrator',
          phone: '+233000000000',
          accountType: 'SuperAdmin',
          balance: 0,
          currency: 'GHS',
          status: 'Active',
          emailVerified: true,
          vendorId: 1, // Default vendor
        });
        await this.userRepository.save(adminUser);
        this.logger.log('✅ Default admin user created: admin@evcharging.com / admin123');
      } else {
        this.logger.log('ℹ️  Default admin user already exists');
      }

      // Check if walk-in customer user exists
      let walkInUser = await this.userRepository.findOne({
        where: { email: 'walkin@evcharging.com' },
      });

      if (!walkInUser) {
        const walkInPasswordHash = await bcrypt.hash('walkin123', 10);
        walkInUser = this.userRepository.create({
          email: 'walkin@evcharging.com',
          passwordHash: walkInPasswordHash,
          firstName: 'Walk-In',
          lastName: 'Customer',
          accountType: 'WalkIn',
          balance: 0,
          currency: 'GHS',
          status: 'Active',
          emailVerified: false,
          vendorId: 1, // Default vendor
        });
        await this.userRepository.save(walkInUser);
        this.logger.log('✅ Walk-in customer user created');
      } else {
        this.logger.log('ℹ️  Walk-in customer user already exists');
      }

      // Create admin users for vendor 1
      const adminUsers = [
        { email: 'admin1@vendor1.com', firstName: 'Vendor', lastName: 'Admin One' },
        { email: 'admin2@vendor1.com', firstName: 'Vendor', lastName: 'Admin Two' },
      ];

      for (const adminData of adminUsers) {
        let adminUser = await this.userRepository.findOne({
          where: { email: adminData.email },
        });

        if (!adminUser) {
          const adminPasswordHash = await bcrypt.hash('admin123', 10);
          adminUser = this.userRepository.create({
            email: adminData.email,
            passwordHash: adminPasswordHash,
            firstName: adminData.firstName,
            lastName: adminData.lastName,
            accountType: 'Admin',
            balance: 0,
            currency: 'GHS',
            status: 'Active',
            emailVerified: true,
            vendorId: 1, // Default vendor
          });
          await this.userRepository.save(adminUser);
          this.logger.log(`✅ Admin user created: ${adminData.email} / admin123`);
        } else {
          // Update password hash if user exists (in case it was wrong)
          const adminPasswordHash = await bcrypt.hash('admin123', 10);
          adminUser.passwordHash = adminPasswordHash;
          adminUser.accountType = 'Admin';
          adminUser.status = 'Active';
          await this.userRepository.save(adminUser);
          this.logger.log(`✅ Admin user updated: ${adminData.email} / admin123`);
        }
      }

      // Create customer users for vendor 1
      const customerUsers = [
        { email: 'customer1@vendor1.com', firstName: 'John', lastName: 'Doe', balance: 100.00 },
        { email: 'customer2@vendor1.com', firstName: 'Jane', lastName: 'Smith', balance: 50.00 },
        { email: 'customer3@vendor1.com', firstName: 'Bob', lastName: 'Johnson', balance: 0.00 },
      ];

      for (const customerData of customerUsers) {
        let customerUser = await this.userRepository.findOne({
          where: { email: customerData.email },
        });

        if (!customerUser) {
          const customerPasswordHash = await bcrypt.hash('customer123', 10);
          customerUser = this.userRepository.create({
            email: customerData.email,
            passwordHash: customerPasswordHash,
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            accountType: 'Customer',
            balance: customerData.balance,
            currency: 'GHS',
            status: 'Active',
            emailVerified: true,
            vendorId: 1, // Default vendor
          });
          await this.userRepository.save(customerUser);
          this.logger.log(`✅ Customer user created: ${customerData.email} / customer123`);
        } else {
          // Update password hash if user exists
          const customerPasswordHash = await bcrypt.hash('customer123', 10);
          customerUser.passwordHash = customerPasswordHash;
          customerUser.accountType = 'Customer';
          customerUser.status = 'Active';
          await this.userRepository.save(customerUser);
          this.logger.log(`✅ Customer user updated: ${customerData.email} / customer123`);
        }
      }
    } catch (error) {
      this.logger.error('Error seeding default users:', error);
    }
  }
}

