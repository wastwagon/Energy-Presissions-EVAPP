import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('config_keys')
export class ConfigKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'charge_point_id', nullable: true })
  chargePointId: string;

  @Column({ length: 100 })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ default: false })
  readonly: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



