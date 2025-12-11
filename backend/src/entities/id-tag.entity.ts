import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('id_tags')
export class IdTag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_tag', unique: true, length: 50 })
  idTag: string;

  @ManyToOne(() => User, (user) => user.idTags, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ name: 'parent_id_tag', length: 50, nullable: true })
  parentIdTag: string;

  @Column({
    type: 'enum',
    enum: ['Active', 'Blocked', 'Expired', 'Invalid'],
    default: 'Active',
  })
  status: string;

  @Column({ name: 'expiry_date', type: 'timestamp', nullable: true })
  expiryDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

