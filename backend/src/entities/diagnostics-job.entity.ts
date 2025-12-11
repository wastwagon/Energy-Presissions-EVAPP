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

@Entity('diagnostics_jobs')
export class DiagnosticsJob {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChargePoint)
  @JoinColumn({ name: 'charge_point_id', referencedColumnName: 'chargePointId' })
  chargePoint: ChargePoint;

  @Column({ name: 'charge_point_id' })
  chargePointId: string;

  @Column({ type: 'text' })
  location: string; // URL to upload diagnostics

  @Column({ name: 'start_time', type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ name: 'stop_time', type: 'timestamp', nullable: true })
  stopTime: Date;

  @Column({ length: 50, default: 'Pending' })
  status: string; // 'Pending', 'Uploading', 'Uploaded', 'UploadFailed'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}



