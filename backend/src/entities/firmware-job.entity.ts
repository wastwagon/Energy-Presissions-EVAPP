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

@Entity('firmware_jobs')
export class FirmwareJob {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChargePoint)
  @JoinColumn({ name: 'charge_point_id', referencedColumnName: 'chargePointId' })
  chargePoint: ChargePoint;

  @Column({ name: 'charge_point_id' })
  chargePointId: string;

  @Column({ type: 'text' })
  location: string; // URL to firmware file

  @Column({ name: 'retrieve_date', type: 'timestamp' })
  retrieveDate: Date;

  @Column({ name: 'retry_interval', default: 0 })
  retryInterval: number;

  @Column({ default: 0 })
  retries: number;

  @Column({ length: 50, default: 'Pending' })
  status: string; // 'Pending', 'Downloading', 'Installing', 'Installed', 'InstallationFailed'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}



