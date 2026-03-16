import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SuperAdmin')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get audit logs (SuperAdmin only)' })
  async getLogs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.service.findAll(
      limit ? parseInt(limit.toString()) : 100,
      offset ? parseInt(offset.toString()) : 0,
    );
  }
}
