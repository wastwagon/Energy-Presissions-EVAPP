import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ChargePoint } from './charge-point.entity';

@Entity('user_favorites')
export class UserFavorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'charge_point_id' })
  chargePointId: string;

  @ManyToOne(() => ChargePoint, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'charge_point_id', referencedColumnName: 'chargePointId' })
  chargePoint: ChargePoint;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
