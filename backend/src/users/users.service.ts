import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async delete(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
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

