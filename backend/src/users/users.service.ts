import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { IdTag } from '../entities/id-tag.entity';
import { UserFavorite } from '../entities/user-favorite.entity';
import { ChargePoint } from '../entities/charge-point.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(IdTag)
    private idTagRepository: Repository<IdTag>,
    @InjectRepository(UserFavorite)
    private userFavoriteRepository: Repository<UserFavorite>,
    @InjectRepository(ChargePoint)
    private chargePointRepository: Repository<ChargePoint>,
    private dataSource: DataSource,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['idTags'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['idTags'],
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['idTags'],
    });
  }

  /** Loads password reset fields (excluded from default SELECT). Use for reset-password validation. */
  async findByEmailWithPasswordReset(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordResetToken')
      .addSelect('user.passwordResetExpiresAt')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByPhone(phone: string): Promise<User | null> {
    if (!phone) return null;
    return this.userRepository.findOne({
      where: { phone },
      relations: ['idTags'],
    });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    
    // Hash password if provided
    if (data.passwordHash) {
      user.passwordHash = await bcrypt.hash(data.passwordHash, 10);
    }

    return this.userRepository.save(user);
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    
    // Hash password if provided
    if (data.passwordHash) {
      data.passwordHash = await bcrypt.hash(data.passwordHash, 10);
    }

    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  async setPasswordAndClearResetToken(id: number, plainPassword: string): Promise<User> {
    const user = await this.findOne(id);
    user.passwordHash = await bcrypt.hash(plainPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    return this.userRepository.save(user);
  }

  /**
   * Removes a user row after clearing FKs that would block DELETE (invoices, payments; nulls transactions.user_id).
   * Wallet rows, favorites, and payment methods cascade at DB level where configured.
   */
  async deleteUserCascade(id: number): Promise<void> {
    await this.findOne(id);
    await this.dataSource.transaction(async (manager) => {
      await manager.query(`DELETE FROM invoices WHERE user_id = $1`, [id]);
      await manager.query(`DELETE FROM payments WHERE user_id = $1`, [id]);
      await manager.query(`UPDATE transactions SET user_id = NULL WHERE user_id = $1`, [id]);
      const result = await manager.delete(User, { id });
      if (!result.affected) {
        throw new NotFoundException(`User ${id} not found`);
      }
    });
  }

  async delete(id: number): Promise<void> {
    await this.deleteUserCascade(id);
  }

  /** Customer self-service: verify password, then delete. */
  async deleteOwnAccount(userId: number, password: string, accountType: string): Promise<void> {
    if (accountType !== 'Customer') {
      throw new ForbiddenException('This account type cannot be deleted here. Contact support.');
    }
    const user = await this.findOne(userId);
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new BadRequestException('Incorrect password');
    }
    await this.deleteUserCascade(userId);
  }

  async getIdTags(userId: number): Promise<IdTag[]> {
    await this.findOne(userId); // Verify user exists
    return this.idTagRepository.find({
      where: { userId },
    });
  }

  async getFavorites(userId: number): Promise<string[]> {
    await this.findOne(userId);
    const favorites = await this.userFavoriteRepository.find({
      where: { userId },
    });
    return favorites.map((f) => f.chargePointId);
  }

  async addFavorite(userId: number, chargePointId: string): Promise<void> {
    await this.findOne(userId);
    const cp = await this.chargePointRepository.findOne({
      where: { chargePointId },
    });
    if (!cp) {
      throw new NotFoundException(`Charge point ${chargePointId} not found`);
    }
    const existing = await this.userFavoriteRepository.findOne({
      where: { userId, chargePointId },
    });
    if (existing) {
      throw new ConflictException('Station already in favorites');
    }
    await this.userFavoriteRepository.save({ userId, chargePointId });
  }

  async removeFavorite(userId: number, chargePointId: string): Promise<void> {
    await this.findOne(userId);
    const result = await this.userFavoriteRepository.delete({
      userId,
      chargePointId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('Favorite not found');
    }
  }
}

