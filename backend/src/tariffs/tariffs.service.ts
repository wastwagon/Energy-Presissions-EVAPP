import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tariff } from '../entities/tariff.entity';

@Injectable()
export class TariffsService {
  constructor(
    @InjectRepository(Tariff)
    private tariffRepository: Repository<Tariff>,
  ) {}

  async findAll(): Promise<Tariff[]> {
    return this.tariffRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Tariff> {
    const tariff = await this.tariffRepository.findOne({
      where: { id },
    });

    if (!tariff) {
      throw new NotFoundException(`Tariff with ID ${id} not found`);
    }

    return tariff;
  }

  async create(data: {
    name: string;
    description?: string;
    energyRate?: number;
    timeRate?: number;
    baseFee?: number;
    currency?: string;
    validFrom?: Date;
    validTo?: Date;
  }): Promise<Tariff> {
    // Deactivate other tariffs if this one should be active
    if (data.validFrom && (!data.validTo || new Date(data.validTo) > new Date())) {
      // This tariff will be active, so deactivate others
      await this.tariffRepository.update(
        { currency: data.currency || 'GHS', isActive: true },
        { isActive: false },
      );
    }

    const tariff = this.tariffRepository.create({
      ...data,
      currency: data.currency || 'GHS',
      isActive: true,
    });

    return this.tariffRepository.save(tariff);
  }

  async update(id: number, data: Partial<Tariff>): Promise<Tariff> {
    const tariff = await this.findOne(id);

    // If activating this tariff, deactivate others with same currency
    if (data.isActive === true) {
      const activeTariffs = await this.tariffRepository.find({
        where: { currency: tariff.currency, isActive: true },
      });
      for (const activeTariff of activeTariffs) {
        if (activeTariff.id !== id) {
          activeTariff.isActive = false;
          await this.tariffRepository.save(activeTariff);
        }
      }
    }

    Object.assign(tariff, data);
    return this.tariffRepository.save(tariff);
  }

  async delete(id: number): Promise<void> {
    const tariff = await this.findOne(id);
    await this.tariffRepository.remove(tariff);
  }

  async getActiveTariff(currency: string = 'GHS'): Promise<Tariff | null> {
    return this.tariffRepository.findOne({
      where: {
        currency,
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });
  }
}

