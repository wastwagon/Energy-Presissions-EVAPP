import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './transaction.entity';

@Entity('meter_samples')
export class MeterSample {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.meterSamples, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: number;

  @Column({ name: 'charge_point_id' })
  chargePointId: string;

  @Column({ name: 'connector_id' })
  connectorId: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ length: 100, nullable: true })
  measurand: string;

  @Column({ length: 50, nullable: true })
  location: string;

  @Column({ length: 10, nullable: true })
  phase: string;

  @Column({ length: 20, nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  value: number;

  @Column({ length: 50, nullable: true })
  context: string;

  @Column({ length: 50, nullable: true })
  format: string;

  @CreateDateColumn()
  createdAt: Date;
}



