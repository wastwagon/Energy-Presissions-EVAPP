import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { VendorStatusService } from '../../vendors/vendor-status.service';
import { VendorsService } from '../../vendors/vendors.service';

// Metadata key for skipping vendor check
export const SKIP_VENDOR_CHECK = 'skipVendorCheck';
export const SkipVendorCheck = () => SetMetadata(SKIP_VENDOR_CHECK, true);

@Injectable()
export class VendorStatusGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private vendorStatusService: VendorStatusService,
    private vendorsService: VendorsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if vendor check should be skipped
    const skipCheck = this.reflector.getAllAndOverride<boolean>(SKIP_VENDOR_CHECK, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Resolve vendorId from request
    const vendorId = await this.resolveVendorId(request);

    if (!vendorId) {
      // If no vendorId found, allow (for backward compatibility or public endpoints)
      return true;
    }

    // Get vendor status
    const status = await this.vendorStatusService.getVendorStatus(vendorId);

    // Handle disabled vendor
    if (status === 'disabled') {
      throw new ForbiddenException({
        code: 'VENDOR_DISABLED',
        message: 'Vendor account is disabled. Access is not available.',
      });
    }

    // Handle suspended vendor
    if (status === 'suspended') {
      // Allow read-only operations (GET, HEAD, OPTIONS)
      const readOnlyMethods = ['GET', 'HEAD', 'OPTIONS'];
      if (readOnlyMethods.includes(method)) {
        // Allow read-only, but set flag for frontend to show suspended banner
        request.vendorSuspended = true;
        return true;
      }

      // Block mutations, but allow StopTransaction for safety
      const allowedMutations = ['POST'];
      const path = request.url;
      if (
        allowedMutations.includes(method) &&
        (path.includes('/transactions/') && path.includes('/stop') ||
          path.includes('/stop-transaction'))
      ) {
        // Allow StopTransaction even when suspended (safety)
        return true;
      }

      throw new ForbiddenException({
        code: 'VENDOR_SUSPENDED',
        message: 'Vendor account is suspended. Write operations are not available.',
        retryAfter: null, // Can be set to a future date if auto-enable is scheduled
      });
    }

    // Active vendor - allow all
    return true;
  }

  /**
   * Resolve vendorId from request
   * Priority: JWT token > Domain mapping > Default vendor
   */
  private async resolveVendorId(request: any): Promise<number | null> {
    // 1. Try JWT token (from user object set by auth guard)
    if (request.user?.vendorId) {
      return request.user.vendorId;
    }

    // 2. Try domain mapping (for white-label portals)
    const hostname = request.hostname || request.headers.host;
    if (hostname) {
      const vendor = await this.vendorsService.findByDomain(hostname);
      if (vendor) {
        return vendor.id;
      }
    }

    // 3. Try to get from charge point (for OCPP-related endpoints)
    if (request.params?.id) {
      // This is a simplified check - in production, you'd query the charge point
      // For now, return null and let the endpoint handle it
    }

    // 4. Default vendor for backward compatibility
    // Return null to allow endpoints to handle vendor resolution themselves
    return null;
  }
}

