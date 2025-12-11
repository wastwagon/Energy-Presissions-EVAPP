import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tariffs')
export class Tariff {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'energy_rate', type: 'decimal', precision: 10, scale: 4, nullable: true })
  energyRate: number;

  @Column({ name: 'time_rate', type: 'decimal', precision: 10, scale: 4, nullable: true })
  timeRate: number;

  @Column({ name: 'base_fee', type: 'decimal', precision: 10, scale: 2, nullable: true })
  baseFee: number;

  @Column({ length: 3, default: 'GHS' })
  currency: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'valid_from', type: 'timestamp', nullable: true })
  validFrom: Date;

  @Column({ name: 'valid_to', type: 'timestamp', nullable: true })
  validTo: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

