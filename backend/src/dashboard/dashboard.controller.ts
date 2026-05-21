import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

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
    const vendorIdHeader = req.headers['x-vendor-id'];
    
    // If X-Vendor-Id header is present (vendor impersonation), use it
    if (vendorIdHeader) {
      const vendorId = parseInt(vendorIdHeader);
      if (!isNaN(vendorId)) {
        return this.dashboardService.getVendorAdminStats(vendorId);
      }
    }
    
    // Super Admin gets all-vendor stats (unless impersonating)
    if (user.accountType === 'SuperAdmin' && !vendorIdHeader) {
      return this.dashboardService.getSuperAdminStats();
    }
    
    // Vendor Admin gets vendor-scoped stats
    if (user.accountType === 'Admin' && user.vendorId) {
      return this.dashboardService.getVendorAdminStats(user.vendorId);
    }
    
    // Default to vendor-scoped if vendorId is available
    if (user.vendorId) {
      return this.dashboardService.getVendorAdminStats(user.vendorId);
    }
    
    // Fallback to super admin stats if no vendorId
    return this.dashboardService.getSuperAdminStats();
  }

  private resolveVendorId(req: {
    user: { accountType: string; vendorId?: number };
    headers: Record<string, string | string[] | undefined>;
  }): number | undefined {
    const vendorIdHeader = req.headers['x-vendor-id'];
    if (vendorIdHeader) {
      const parsed = parseInt(String(vendorIdHeader), 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    if (req.user.accountType === 'Admin' && req.user.vendorId) {
      return req.user.vendorId;
    }
    if (req.user.accountType === 'SuperAdmin') {
      return undefined;
    }
    return req.user.vendorId;
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
    return this.dashboardService.getRevenueTrend(vendorId, parsedDays);
  }
}

