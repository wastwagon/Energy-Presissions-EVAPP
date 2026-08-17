import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vendor } from './vendor.entity';

export type VendorPayoutStatus = 'paid' | 'failed';

@Entity('vendor_payouts')
export class VendorPayout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'vendor_id' })
  vendorId: number;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'GHS' })
  currency: string;

  @Column({ type: 'enum', enum: ['paid', 'failed'], default: 'paid' })
  status: VendorPayoutStatus;

  @Column({ name: 'paid_at', type: 'timestamp' })
  paidAt: Date;

  @Column({ length: 128, nullable: true })
  reference: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'method_snapshot', length: 64, nullable: true })
  methodSnapshot: string | null;

  @Column({ name: 'destination_snapshot', length: 128, nullable: true })
  destinationSnapshot: string | null;

  @Column({ name: 'by_user_id', nullable: true })
  byUserId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
