import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
}

