import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { IdTag } from '../entities/id-tag.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(IdTag)
    private idTagRepository: Repository<IdTag>,
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
}

