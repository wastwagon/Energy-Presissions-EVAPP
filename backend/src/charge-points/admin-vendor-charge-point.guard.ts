import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ChargePointsService } from './charge-points.service';

/**
 * Vendor Admin may only operate charge points that belong to their JWT vendor.
 * SuperAdmin and customers are not restricted here (customers have separate ownership checks).
 */
@Injectable()
export class AdminVendorChargePointGuard implements CanActivate {
  constructor(private readonly chargePointsService: ChargePointsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { accountType?: string; vendorId?: number } | undefined;
    const id = request.params?.id as string | undefined;
    if (!id || user?.accountType !== 'Admin') {
      return true;
    }
    const chargePoint = await this.chargePointsService.findOne(id);
    if (
      chargePoint.vendorId == null ||
      user.vendorId == null ||
      chargePoint.vendorId !== user.vendorId
    ) {
      throw new ForbiddenException('You can only access charge points that belong to your vendor.');
    }
    return true;
  }
}
