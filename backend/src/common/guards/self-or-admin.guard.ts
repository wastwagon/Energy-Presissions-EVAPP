import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard that allows access when:
 * - User is Admin or SuperAdmin (full access), OR
 * - User is accessing their own resource (param id matches request.user.id)
 */
@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const allowedRoles = ['Admin', 'SuperAdmin'];
    if (allowedRoles.includes(user.accountType)) {
      return true;
    }

    const paramId = request.params.id != null
      ? parseInt(request.params.id, 10)
      : request.params.userId != null
      ? parseInt(request.params.userId, 10)
      : NaN;
    const userId = typeof user.id === 'number' ? user.id : parseInt(user.id, 10);

    if (!isNaN(paramId) && paramId === userId) {
      return true;
    }

    throw new ForbiddenException('You can only access your own resource');
  }
}
