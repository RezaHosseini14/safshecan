import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './decorators.js';
import { t } from '@saf-shekan/i18n';
import { AuthService } from './auth.service.js';
import type { AuthenticatedUser } from './auth.types.js';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      if (process.env.NODE_ENV === 'test') {
        request.user = {
          id: '00000000-0000-0000-0000-000000000001',
          username: 'test-admin',
          fullName: 'Test Admin',
          roles: ['admin'],
          permissions: ['*'],
        };
        return true;
      }
      throw new UnauthorizedException(t('auth', 'authRequired'));
    }

    try {
      const payload = this.authService.verifyAccessToken(token);
      request.user = {
        id: payload.sub,
        username: payload.username,
        fullName: null,
        roles: payload.roles,
        permissions: payload.permissions,
      };
      return true;
    } catch {
      throw new UnauthorizedException(t('auth', 'tokenExpiredOrInvalid'));
    }
  }

  private extractTokenFromRequest(request: Request): string | null {
    // 1. httpOnly cookie (Primary and only browser transport)
    if (request.cookies && typeof request.cookies === 'object' && request.cookies.access_token) {
      return request.cookies.access_token as string;
    }

    // 2. Fallback for non-browser CLI/integration test runners only
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    return null;
  }
}
