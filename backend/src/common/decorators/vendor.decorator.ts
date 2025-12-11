import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract vendorId from request
 * Can be used in controllers to get vendorId from JWT token or domain
 */
export const VendorId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest();
    
    // Try to get from JWT token first
    if (request.user?.vendorId) {
      return request.user.vendorId;
    }
    
    // Try to get from domain mapping (for white-label portals)
    if (request.vendorId) {
      return request.vendorId;
    }
    
    // Fallback to default vendor (for backward compatibility)
    return 1;
  },
);

