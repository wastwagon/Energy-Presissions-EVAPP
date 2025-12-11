import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

export type TenantStatus = 'active' | 'suspended' | 'disabled';

@Entity('tenant_disablements')
export class TenantDisablement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tenant, (tenant) => tenant.disablements)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId: number;

  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'disabled'],
  })
  status: TenantStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'effective_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  effectiveAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'by_user_id' })
  byUser: User;

  @Column({ name: 'by_user_id', nullable: true })
  byUserId: number;

  @Column({ name: 'lifted_at', type: 'timestamp', nullable: true })
  liftedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}



