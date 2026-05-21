import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Tariff } from '../entities/tariff.entity';

@Injectable()
export class TariffsService {
  constructor(
    @InjectRepository(Tariff)
    private tariffRepository: Repository<Tariff>,
  ) {}

  async findAll(vendorId?: number): Promise<Tariff[]> {
    const qb = this.tariffRepository.createQueryBuilder('t').orderBy('t.createdAt', 'DESC');

    if (vendorId != null) {
      qb.where('(t.vendor_id = :vendorId OR t.vendor_id IS NULL)', { vendorId });
    }

    return qb.getMany();
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
    vendorId?: number | null;
  }): Promise<Tariff> {
    const currency = data.currency || 'GHS';
    const vendorId = data.vendorId ?? null;

    if (data.validFrom && (!data.validTo || new Date(data.validTo) > new Date())) {
      const deactivateQb = this.tariffRepository
        .createQueryBuilder()
        .update(Tariff)
        .set({ isActive: false })
        .where('currency = :currency', { currency })
        .andWhere('is_active = true');

      if (vendorId != null) {
        deactivateQb.andWhere('vendor_id = :vendorId', { vendorId });
      } else {
        deactivateQb.andWhere('vendor_id IS NULL');
      }

      await deactivateQb.execute();
    }

    const tariff = this.tariffRepository.create({
      ...data,
      vendorId,
      currency,
      isActive: true,
    });

    return this.tariffRepository.save(tariff);
  }

  async update(id: number, data: Partial<Tariff>): Promise<Tariff> {
    const tariff = await this.findOne(id);

    if (data.isActive === true) {
      const where =
        tariff.vendorId != null
          ? { currency: tariff.currency, isActive: true, vendorId: tariff.vendorId }
          : { currency: tariff.currency, isActive: true, vendorId: IsNull() };

      const activeTariffs = await this.tariffRepository.find({ where });
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

  async getActiveTariff(currency: string = 'GHS', vendorId?: number): Promise<Tariff | null> {
    const qb = this.tariffRepository
      .createQueryBuilder('t')
      .where('t.is_active = true')
      .andWhere('t.currency = :currency', { currency });

    if (vendorId != null) {
      qb.andWhere('(t.vendor_id = :vendorId OR t.vendor_id IS NULL)', { vendorId });
      qb.orderBy('CASE WHEN t.vendor_id = :vendorId THEN 0 ELSE 1 END', 'ASC').addOrderBy(
        't.created_at',
        'DESC',
      );
    } else {
      qb.andWhere('t.vendor_id IS NULL').orderBy('t.created_at', 'DESC');
    }

    const tariffs = await qb.getMany();
    return tariffs[0] ?? null;
  }
}
