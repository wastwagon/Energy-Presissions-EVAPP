import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantStatusService } from '../../tenants/tenant-status.service';
import { TenantsService } from '../../tenants/tenants.service';

// Metadata key for skipping tenant check
export const SKIP_TENANT_CHECK = 'skipTenantCheck';
export const SkipTenantCheck = () => SetMetadata(SKIP_TENANT_CHECK, true);

@Injectable()
export class TenantStatusGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantStatusService: TenantStatusService,
    private tenantsService: TenantsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if tenant check should be skipped
    const skipCheck = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_CHECK, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Resolve tenantId from request
    const tenantId = await this.resolveTenantId(request);

    if (!tenantId) {
      // If no tenantId found, allow (for backward compatibility or public endpoints)
      return true;
    }

    // Get tenant status
    const status = await this.tenantStatusService.getTenantStatus(tenantId);

    // Handle disabled tenant
    if (status === 'disabled') {
      throw new ForbiddenException({
        code: 'TENANT_DISABLED',
        message: 'Tenant account is disabled. Access is not available.',
      });
    }

    // Handle suspended tenant
    if (status === 'suspended') {
      // Allow read-only operations (GET, HEAD, OPTIONS)
      const readOnlyMethods = ['GET', 'HEAD', 'OPTIONS'];
      if (readOnlyMethods.includes(method)) {
        // Allow read-only, but set flag for frontend to show suspended banner
        request.tenantSuspended = true;
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
        code: 'TENANT_SUSPENDED',
        message: 'Tenant account is suspended. Write operations are not available.',
        retryAfter: null, // Can be set to a future date if auto-enable is scheduled
      });
    }

    // Active tenant - allow all
    return true;
  }

  /**
   * Resolve tenantId from request
   * Priority: JWT token > Domain mapping > Default tenant
   */
  private async resolveTenantId(request: any): Promise<number | null> {
    // 1. Try JWT token (from user object set by auth guard)
    if (request.user?.tenantId) {
      return request.user.tenantId;
    }

    // 2. Try domain mapping (for white-label portals)
    const hostname = request.hostname || request.headers.host;
    if (hostname) {
      const tenant = await this.tenantsService.findByDomain(hostname);
      if (tenant) {
        return tenant.id;
      }
    }

    // 3. Try to get from charge point (for OCPP-related endpoints)
    if (request.params?.id) {
      // This is a simplified check - in production, you'd query the charge point
      // For now, return null and let the endpoint handle it
    }

    // 4. Default tenant for backward compatibility
    // Return null to allow endpoints to handle tenant resolution themselves
    return null;
  }
}

