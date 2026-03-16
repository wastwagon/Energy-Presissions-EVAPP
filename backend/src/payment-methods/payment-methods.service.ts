import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from '../entities/payment-method.entity';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private repo: Repository<PaymentMethod>,
  ) {}

  async findByUser(userId: number): Promise<PaymentMethod[]> {
    return this.repo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(
    userId: number,
    data: { type: string; provider?: string; lastFour?: string; phone?: string; isDefault?: boolean },
  ): Promise<PaymentMethod> {
    if (data.isDefault) {
      await this.repo.update({ userId }, { isDefault: false });
    }
    const pm = this.repo.create({ userId, ...data });
    return this.repo.save(pm);
  }

  async setDefault(userId: number, id: number): Promise<PaymentMethod> {
    const pm = await this.repo.findOne({ where: { id, userId } });
    if (!pm) throw new NotFoundException('Payment method not found');
    await this.repo.update({ userId }, { isDefault: false });
    pm.isDefault = true;
    return this.repo.save(pm);
  }

  async delete(userId: number, id: number): Promise<void> {
    const result = await this.repo.delete({ id, userId });
    if (result.affected === 0) throw new NotFoundException('Payment method not found');
  }
}
