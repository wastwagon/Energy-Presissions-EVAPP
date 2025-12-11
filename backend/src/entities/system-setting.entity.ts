import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type SettingCategory = 'branding' | 'billing' | 'ocpp' | 'payment' | 'notification' | 'general';
export type SettingDataType = 'string' | 'number' | 'boolean' | 'json';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ length: 100 })
  category: SettingCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'data_type', length: 50, default: 'string' })
  dataType: SettingDataType;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}



