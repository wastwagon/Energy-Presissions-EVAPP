import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChargePoint } from './charge-point.entity';

@Entity('local_auth_list_versions')
export class LocalAuthListVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChargePoint)
  @JoinColumn({ name: 'charge_point_id', referencedColumnName: 'chargePointId' })
  chargePoint: ChargePoint;

  @Column({ name: 'charge_point_id', unique: true })
  chargePointId: string;

  @Column({ name: 'list_version', default: 1 })
  listVersion: number;

  @Column({ name: 'update_type', length: 20, default: 'Full' })
  updateType: string; // 'Full', 'Differential'

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}



