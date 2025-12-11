import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vendor } from './vendor.entity';
import { User } from './user.entity';

export type VendorStatus = 'active' | 'suspended' | 'disabled';

@Entity('vendor_disablements')
export class VendorDisablement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vendor, (vendor) => vendor.disablements)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'vendor_id' })
  vendorId: number;

  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'disabled'],
  })
  status: VendorStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'effective_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  effectiveAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'by_user_id' })
  byUser: User;

  @Column({ name: 'by_user_id', nullable: true })
  byUserId: number;

  @Column({ name: 'lifted_at', type: 'timestamp', nullable: true })
  liftedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

