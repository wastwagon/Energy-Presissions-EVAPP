import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private repo: Repository<AuditLog>,
  ) {}

  async log(data: {
    userId?: number;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const log = this.repo.create(data);
    return this.repo.save(log);
  }

  async findAll(limit = 100, offset = 0): Promise<{ logs: AuditLog[]; total: number }> {
    const [logs, total] = await this.repo.findAndCount({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { logs, total };
  }
}
