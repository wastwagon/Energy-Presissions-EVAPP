import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FirmwareService } from './firmware.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Firmware')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SuperAdmin', 'Admin')
@Controller('firmware')
export class FirmwareController {
  constructor(private readonly firmwareService: FirmwareService) {}

  @Post('update')
  @ApiOperation({ summary: 'Update firmware' })
  @ApiResponse({ status: 200, description: 'Firmware update initiated' })
  async updateFirmware(
    @Body()
    body: {
      chargePointId: string;
      location: string;
      retrieveDate: string;
      retryInterval?: number;
      retries?: number;
    },
  ) {
    return this.firmwareService.updateFirmware(body);
  }

  @Get('jobs/:chargePointId')
  @ApiOperation({ summary: 'Get firmware jobs for charge point' })
  @ApiResponse({ status: 200, description: 'List of firmware jobs' })
  async getFirmwareJobs(@Param('chargePointId') chargePointId: string) {
    return this.firmwareService.getFirmwareJobs(chargePointId);
  }

  @Get('job/:id')
  @ApiOperation({ summary: 'Get firmware job by ID' })
  @ApiResponse({ status: 200, description: 'Firmware job details' })
  async getFirmwareJob(@Param('id', ParseIntPipe) id: number) {
    return this.firmwareService.getFirmwareJob(id);
  }
}
