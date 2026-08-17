import { Controller, Get, Post, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { resolveStaffVendorScope } from '../common/utils/staff-vendor-scope';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'Admin')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  async getStats(@Request() req: any) {
    const user = req.user;
    const impersonatedVendorId = resolveStaffVendorScope(user, req.headers['x-vendor-id']);

    if (user.accountType === 'Admin') {
      if (impersonatedVendorId == null) {
        throw new ForbiddenException('Vendor admin is not assigned to a vendor.');
      }
      return this.dashboardService.getVendorAdminStats(impersonatedVendorId);
    }

    if (user.accountType === 'SuperAdmin') {
      if (impersonatedVendorId != null) {
        return this.dashboardService.getVendorAdminStats(impersonatedVendorId);
      }
      return this.dashboardService.getSuperAdminStats();
    }

    throw new ForbiddenException('Dashboard stats are available to staff accounts only.');
  }

  private resolveVendorId(req: {
    user: { accountType: string; vendorId?: number };
    headers: Record<string, string | string[] | undefined>;
  }): number | undefined {
    return resolveStaffVendorScope(req.user, req.headers['x-vendor-id']);
  }

  @Get('revenue-trend')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'Admin')
  @ApiOperation({ summary: 'Daily revenue trend for completed billed sessions' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: '7–90 days (default 30)' })
  @ApiResponse({ status: 200, description: 'Daily revenue points' })
  async getRevenueTrend(
    @Request() req: { user: { accountType: string; vendorId?: number }; headers: Record<string, string | string[] | undefined> },
    @Query('days') days?: string,
  ) {
    const parsedDays = days ? parseInt(days, 10) : 30;
    const vendorId = this.resolveVendorId(req);
    if (req.user.accountType === 'Admin' && vendorId == null) {
      throw new ForbiddenException('Vendor admin is not assigned to a vendor.');
    }
    return this.dashboardService.getRevenueTrend(vendorId, parsedDays);
  }

  @Post('ops/maintenance')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin')
  @ApiOperation({
    summary: 'Release stale wallet holds and clear stuck connector operational state',
  })
  @ApiResponse({ status: 200, description: 'Maintenance summary' })
  async runOpsMaintenance(
    @Query('releaseWalletHours') releaseWalletHours?: string,
    @Query('sweepConnectorMinutes') sweepConnectorMinutes?: string,
  ) {
    return this.dashboardService.runOpsMaintenance({
      releaseWalletHours: releaseWalletHours
        ? parseInt(releaseWalletHours, 10)
        : undefined,
      sweepConnectorMinutes: sweepConnectorMinutes
        ? parseInt(sweepConnectorMinutes, 10)
        : undefined,
    });
  }
}

