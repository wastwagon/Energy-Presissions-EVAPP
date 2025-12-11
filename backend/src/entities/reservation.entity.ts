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
import { IdTag } from './id-tag.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'reservation_id', unique: true })
  reservationId: number;

  @ManyToOne(() => ChargePoint)
  @JoinColumn({ name: 'charge_point_id', referencedColumnName: 'chargePointId' })
  chargePoint: ChargePoint;

  @Column({ name: 'charge_point_id' })
  chargePointId: string;

  @Column({ name: 'connector_id' })
  connectorId: number;

  @ManyToOne(() => IdTag, { nullable: true })
  @JoinColumn({ name: 'id_tag', referencedColumnName: 'idTag' })
  idTagEntity: IdTag;

  @Column({ name: 'id_tag', length: 50 })
  idTag: string;

  @Column({ name: 'expiry_date', type: 'timestamp' })
  expiryDate: Date;

  @Column({ length: 20, default: 'Active' })
  status: string; // 'Active', 'Used', 'Expired', 'Cancelled'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}



