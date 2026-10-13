import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { t } from '@saf-shekan/i18n';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from './decorators.js';
import type { AuthenticatedUser } from './auth.types.js';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(t('auth', 'unauthorizedNoUser'));
    }

    // Administrator role has superuser bypass
    if (user.roles?.includes('admin')) {
      return true;
    }

    const hasAll = requiredPermissions.every((perm) => user.permissions?.includes(perm));
    if (!hasAll) {
      throw new ForbiddenException(t('auth', 'unauthorizedPermissions'));
    }

    return true;
  }
}
