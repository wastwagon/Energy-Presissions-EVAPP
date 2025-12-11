import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract tenantId from request
 * Can be used in controllers to get tenantId from JWT token or domain
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest();
    
    // Try to get from JWT token first
    if (request.user?.tenantId) {
      return request.user.tenantId;
    }
    
    // Try to get from domain mapping (for white-label portals)
    if (request.tenantId) {
      return request.tenantId;
    }
    
    // Fallback to default tenant (for backward compatibility)
    return 1;
  },
);



