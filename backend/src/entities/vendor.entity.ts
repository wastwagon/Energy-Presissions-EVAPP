import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChargePoint } from './charge-point.entity';
import { User } from './user.entity';
import { VendorDisablement } from './vendor-disablement.entity';

export type VendorStatus = 'active' | 'suspended' | 'disabled';
export type VendorPayoutCycle = 'weekly' | 'biweekly' | 'monthly';
export type VendorPayoutMethod = 'mobile_money' | 'bank';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true, nullable: true })
  slug: string; // URL-friendly identifier

  @Column({ length: 255, unique: true, nullable: true })
  domain: string; // For white-label portals

  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'disabled'],
    default: 'active',
  })
  status: VendorStatus;

  @Column({ name: 'contact_email', length: 255, nullable: true })
  contactEmail: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'business_name', length: 255, nullable: true })
  businessName: string;

  @Column({ name: 'business_registration_number', length: 100, nullable: true })
  businessRegistrationNumber: string;

  @Column({ name: 'tax_id', length: 100, nullable: true })
  taxId: string;

  @Column({ name: 'logo_url', length: 512, nullable: true })
  logoUrl: string;

  @Column({ name: 'receipt_footer_text', type: 'text', nullable: true })
  receiptFooterText: string;

  @Column({ name: 'receipt_header_text', type: 'text', nullable: true })
  receiptHeaderText: string;

  @Column({ name: 'support_email', length: 255, nullable: true })
  supportEmail: string;

  @Column({ name: 'support_phone', length: 20, nullable: true })
  supportPhone: string;

  @Column({ name: 'website_url', length: 255, nullable: true })
  websiteUrl: string;

  @Column({
    name: 'payout_cycle',
    type: 'enum',
    enum: ['weekly', 'biweekly', 'monthly'],
    default: 'monthly',
  })
  payoutCycle: VendorPayoutCycle;

  @Column({ name: 'payout_hold_days', type: 'int', default: 7 })
  payoutHoldDays: number;

  @Column({
    name: 'payout_method',
    type: 'enum',
    enum: ['mobile_money', 'bank'],
    nullable: true,
  })
  payoutMethod: VendorPayoutMethod | null;

  @Column({ name: 'payout_momo_network', length: 32, nullable: true })
  payoutMomoNetwork: string | null;

  @Column({ name: 'payout_momo_phone', length: 20, nullable: true })
  payoutMomoPhone: string | null;

  @Column({ name: 'payout_bank_name', length: 128, nullable: true })
  payoutBankName: string | null;

  @Column({ name: 'payout_account_name', length: 255, nullable: true })
  payoutAccountName: string | null;

  @Column({ name: 'payout_account_number', length: 64, nullable: true })
  payoutAccountNumber: string | null;

  @Column({ name: 'payout_bank_branch', length: 128, nullable: true })
  payoutBankBranch: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional vendor-specific configuration

  @OneToMany(() => ChargePoint, (chargePoint) => chargePoint.vendor)
  chargePoints: ChargePoint[];

  @OneToMany(() => User, (user) => user.vendor)
  users: User[];

  @OneToMany(() => VendorDisablement, (disablement) => disablement.vendor)
  disablements: VendorDisablement[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

