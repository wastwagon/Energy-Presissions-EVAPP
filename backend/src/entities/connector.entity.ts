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

@Entity('connectors')
export class Connector {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChargePoint, (chargePoint) => chargePoint.connectors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'charge_point_id', referencedColumnName: 'chargePointId' })
  chargePoint: ChargePoint;

  @Column({ name: 'charge_point_id' })
  chargePointId: string;

  @Column({ name: 'connector_id' })
  connectorId: number;

  @Column({ name: 'connector_type', length: 50, nullable: true })
  connectorType: string;

  @Column({ name: 'power_rating_kw', type: 'decimal', precision: 10, scale: 2, nullable: true })
  powerRatingKw: number;

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
    ],
    default: 'Available',
  })
  status: string;

  @Column({ length: 50, nullable: true })
  errorCode: string;

  @Column({ name: 'vendor_error_code', length: 255, nullable: true })
  vendorErrorCode: string;

  @Column({ type: 'timestamp', nullable: true, name: 'last_status_update' })
  lastStatusUpdate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

