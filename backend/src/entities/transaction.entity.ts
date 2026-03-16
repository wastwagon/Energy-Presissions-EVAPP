import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ChargePoint } from './charge-point.entity';
import { User } from './user.entity';
import { MeterSample } from './meter-sample.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'transaction_id' })
  transactionId: number;

  @ManyToOne(() => ChargePoint, (chargePoint) => chargePoint.transactions)
  @JoinColumn({ name: 'charge_point_id', referencedColumnName: 'chargePointId' })
  chargePoint: ChargePoint;

  @Column({ name: 'charge_point_id' })
  chargePointId: string;

  @Column({ name: 'connector_id' })
  connectorId: number;

  @Column({ name: 'id_tag', length: 50, nullable: true })
  idTag: string;

  @ManyToOne(() => User, (user) => user.transactions, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ name: 'meter_start' })
  meterStart: number;

  @Column({ name: 'meter_stop', nullable: true })
  meterStop: number;

  @Column({ type: 'timestamp', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'timestamp', name: 'stop_time', nullable: true })
  stopTime: Date;

  @Column({ name: 'total_energy_kwh', type: 'decimal', precision: 10, scale: 3, nullable: true })
  totalEnergyKwh: number;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalCost: number;

  @Column({ length: 3, default: 'GHS' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['Active', 'Completed', 'Cancelled', 'Failed'],
    default: 'Active',
  })
  status: string;

  @Column({ length: 50, nullable: true })
  reason: string;

  @Column({ name: 'reservation_id', nullable: true })
  reservationId: number;

  @Column({ name: 'wallet_reserved_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  walletReservedAmount: number;

  @OneToMany(() => MeterSample, (meterSample) => meterSample.transaction)
  meterSamples: MeterSample[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

