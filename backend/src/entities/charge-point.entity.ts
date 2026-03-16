import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Connector } from './connector.entity';
import { Transaction } from './transaction.entity';
import { Vendor } from './vendor.entity';

@Entity('charge_points')
export class ChargePoint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'charge_point_id', unique: true, length: 50 })
  chargePointId: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.chargePoints)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'vendor_id' })
  vendorId: number;

  @Column({ name: 'vendor', length: 100, nullable: true })
  vendorName: string;

  @Column({ length: 100, nullable: true })
  model: string;

  @Column({ name: 'serial_number', length: 100, nullable: true })
  serialNumber: string;

  @Column({ name: 'firmware_version', length: 50, nullable: true })
  firmwareVersion: string;

  @Column({
    type: 'enum',
    enum: [
      'Available',
      'Preparing',
      'Charging',
      'SuspendedEVSE',
      'SuspendedEV',
      'Finishing',
      'Reserved',
      'Unavailable',
      'Faulted',
      'Offline',
    ],
    default: 'Offline',
  })
  status: string;

  @Column({ name: 'last_heartbeat', type: 'timestamp', nullable: true })
  lastHeartbeat: Date;

  @Column({ name: 'location_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  locationLatitude: number;

  @Column({ name: 'location_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  locationLongitude: number;

  @Column({ name: 'location_address', type: 'text', nullable: true })
  locationAddress: string;

  @Column({ name: 'total_capacity_kw', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalCapacityKw: number;

  @Column({ name: 'price_per_kwh', type: 'decimal', precision: 10, scale: 4, nullable: true })
  pricePerKwh: number;

  @Column({ name: 'currency', length: 3, default: 'GHS', nullable: true })
  currency: string;

  @Column({ length: 50, nullable: true })
  iccid: string;

  @Column({ length: 50, nullable: true })
  imsi: string;

  @Column({ name: 'last_seen', type: 'timestamp', nullable: true })
  lastSeen: Date;

  @Column({ name: 'heartbeat_interval', type: 'int', default: 300 })
  heartbeatInterval: number;

  @Column({ name: 'supported_profiles', type: 'jsonb', nullable: true })
  supportedProfiles: string[];

  @OneToMany(() => Connector, (connector) => connector.chargePoint)
  connectors: Connector[];

  @OneToMany(() => Transaction, (transaction) => transaction.chargePoint)
  transactions: Transaction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

