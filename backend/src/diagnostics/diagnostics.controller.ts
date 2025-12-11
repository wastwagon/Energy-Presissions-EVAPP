import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DiagnosticsService } from './diagnostics.service';

@ApiTags('Diagnostics')
@Controller('diagnostics')
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Post('get')
  @ApiOperation({ summary: 'Get diagnostics' })
  @ApiResponse({ status: 200, description: 'Diagnostics request sent' })
  async getDiagnostics(
    @Body()
    body: {
      chargePointId: string;
      location: string;
      startTime?: string;
      stopTime?: string;
      retryInterval?: number;
      retries?: number;
    },
  ) {
    return this.diagnosticsService.getDiagnostics(body);
  }

  @Get('jobs/:chargePointId')
  @ApiOperation({ summary: 'Get diagnostics jobs for charge point' })
  @ApiResponse({ status: 200, description: 'List of diagnostics jobs' })
  async getDiagnosticsJobs(@Param('chargePointId') chargePointId: string) {
    return this.diagnosticsService.getDiagnosticsJobs(chargePointId);
  }

  @Get('job/:id')
  @ApiOperation({ summary: 'Get diagnostics job by ID' })
  @ApiResponse({ status: 200, description: 'Diagnostics job details' })
  async getDiagnosticsJob(@Param('id', ParseIntPipe) id: number) {
    return this.diagnosticsService.getDiagnosticsJob(id);
  }
}



