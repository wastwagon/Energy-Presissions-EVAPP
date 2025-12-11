import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';

export type ConnectionEventType =
  | 'connection_attempt'
  | 'connection_success'
  | 'connection_failed'
  | 'connection_closed'
  | 'error'
  | 'message_error';

export type ConnectionStatus = 'success' | 'failed' | 'rejected' | 'timeout' | 'error';

@Entity('connection_logs')
export class ConnectionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'charge_point_id', length: 50 })
  chargePointId: string;

  @Column({ name: 'event_type', length: 50 })
  eventType: ConnectionEventType;

  @Column({ length: 50, nullable: true })
  status: ConnectionStatus;

  @Column({ name: 'error_code', length: 100, nullable: true })
  errorCode: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'close_code', nullable: true })
  closeCode: number;

  @Column({ name: 'close_reason', type: 'text', nullable: true })
  closeReason: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'request_url', type: 'text', nullable: true })
  requestUrl: string;

  @ManyToOne(() => Tenant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}



