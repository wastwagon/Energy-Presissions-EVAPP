import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('connection_statistics')
export class ConnectionStatistics {
  @PrimaryColumn({ name: 'charge_point_id', length: 50 })
  chargePointId: string;

  @Column({ name: 'total_attempts', default: 0 })
  totalAttempts: number;

  @Column({ name: 'successful_connections', default: 0 })
  successfulConnections: number;

  @Column({ name: 'failed_connections', default: 0 })
  failedConnections: number;

  @Column({ name: 'last_connection_attempt', type: 'timestamp', nullable: true })
  lastConnectionAttempt: Date;

  @Column({ name: 'last_successful_connection', type: 'timestamp', nullable: true })
  lastSuccessfulConnection: Date;

  @Column({ name: 'last_failed_connection', type: 'timestamp', nullable: true })
  lastFailedConnection: Date;

  @Column({ name: 'last_error_code', length: 100, nullable: true })
  lastErrorCode: string;

  @Column({ name: 'last_error_message', type: 'text', nullable: true })
  lastErrorMessage: string;

  @Column({ name: 'consecutive_failures', default: 0 })
  consecutiveFailures: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}



