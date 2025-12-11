import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChargePoint } from './charge-point.entity';
import { Transaction } from './transaction.entity';

@Entity('charging_profiles')
export class ChargingProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChargePoint)
  @JoinColumn({ name: 'charge_point_id', referencedColumnName: 'chargePointId' })
  chargePoint: ChargePoint;

  @Column({ name: 'charge_point_id' })
  chargePointId: string;

  @Column({ name: 'connector_id', nullable: true })
  connectorId: number;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transaction_id', referencedColumnName: 'transactionId' })
  transaction: Transaction;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: number;

  @Column({ name: 'stack_level', default: 0 })
  stackLevel: number;

  @Column({ name: 'charging_profile_purpose', length: 50 })
  chargingProfilePurpose: string; // 'ChargePointMaxProfile', 'TxDefaultProfile', 'TxProfile'

  @Column({ name: 'charging_profile_kind', length: 50 })
  chargingProfileKind: string; // 'Absolute', 'Recurring', 'Relative'

  @Column({ name: 'valid_from', type: 'timestamp', nullable: true })
  validFrom: Date;

  @Column({ name: 'valid_to', type: 'timestamp', nullable: true })
  validTo: Date;

  @Column({ name: 'charging_schedule', type: 'jsonb' })
  chargingSchedule: {
    duration?: number;
    startSchedule?: string;
    chargingRateUnit: 'A' | 'W';
    chargingSchedulePeriod: Array<{
      startPeriod: number;
      limit: number;
      numberPhases?: number;
    }>;
    minChargingRate?: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}



