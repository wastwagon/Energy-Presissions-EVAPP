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
import { TenantDisablement } from './tenant-disablement.entity';

export type TenantStatus = 'active' | 'suspended' | 'disabled';

@Entity('tenants')
export class Tenant {
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
  status: TenantStatus;

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

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional tenant-specific configuration

  @OneToMany(() => ChargePoint, (chargePoint) => chargePoint.tenant)
  chargePoints: ChargePoint[];

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @OneToMany(() => TenantDisablement, (disablement) => disablement.tenant)
  disablements: TenantDisablement[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

