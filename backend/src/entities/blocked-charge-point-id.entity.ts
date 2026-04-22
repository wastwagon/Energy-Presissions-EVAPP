import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('blocked_charge_point_ids')
export class BlockedChargePointId {
  @PrimaryColumn({ name: 'charge_point_id', length: 50 })
  chargePointId: string;

  @Column({ name: 'blocked_at', type: 'timestamptz' })
  blockedAt: Date;

  @Column({ length: 255, default: 'admin_delete' })
  reason: string;
}
