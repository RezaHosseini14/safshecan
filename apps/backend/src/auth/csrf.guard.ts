import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { t } from '@saf-shekan/i18n';
import { IS_PUBLIC_KEY } from './decorators.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);
  private readonly allowedOrigins: Set<string>;

  constructor(private readonly reflector: Reflector) {
    const rawOrigins = process.env.CSRF_ALLOWED_ORIGINS || 'http://localhost:3000,https://localhost:3000';
    this.allowedOrigins = new Set(
      rawOrigins
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Safe methods do not mutate state
    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    // In test environment, allow local test calls
    if (process.env.NODE_ENV === 'test') {
      return true;
    }

    const origin = request.headers.origin || (request.headers.referer ? new URL(request.headers.referer).origin : null);
    const secFetchSite = request.headers['sec-fetch-site'];

    // 1. Sec-Fetch-Site check: if cross-site, immediately block
    if (secFetchSite === 'cross-site') {
      this.logger.warn(`Blocked cross-site CSRF attempt from origin: ${origin}`);
      throw new ForbiddenException(t('auth', 'csrfDetected'));
    }

    // 2. Origin check against host / configured allowed origins
    if (origin) {
      const lowerOrigin = origin.toLowerCase();
      const host = request.headers.host?.toLowerCase();

      const isSameHost = host && (lowerOrigin === `http://${host}` || lowerOrigin === `https://${host}`);
      const isAllowed = this.allowedOrigins.has(lowerOrigin) || isSameHost;

      if (!isAllowed) {
        this.logger.warn(`Blocked untrusted Origin CSRF attempt: ${origin}`);
        throw new ForbiddenException(t('auth', 'invalidOrigin'));
      }
    }

    return true;
  }
}
