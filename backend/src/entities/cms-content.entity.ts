import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vendor } from './vendor.entity';

export type ContentType = 'text' | 'html' | 'markdown' | 'image' | 'file';

@Entity('cms_content')
export class CmsContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  key: string;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'content_type', length: 50 })
  contentType: ContentType;

  @Column({ length: 100, nullable: true })
  section: string;

  @ManyToOne(() => Vendor, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'vendor_id', nullable: true })
  vendorId: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}



