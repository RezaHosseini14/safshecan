import type { Request, Response } from 'express';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function shouldUseSecureCookies(req: Request): boolean {
  const flag = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (flag === 'true' || flag === '1') return true;
  if (flag === 'false' || flag === '0') return false;

  const forwarded = req.headers['x-forwarded-proto'];
  if (typeof forwarded === 'string' && forwarded.split(',')[0]?.trim() === 'https') {
    return true;
  }

  if (req.secure) return true;
  return false;
}

export function setSessionCookies(
  req: Request,
  res: Response,
  accessToken: string,
  refreshToken: string,
  accessMaxAgeSeconds: number
): void {
  const secure = shouldUseSecureCookies(req);

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: accessMaxAgeSeconds * 1000,
    path: '/',
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: REFRESH_MAX_AGE_MS,
    path: '/',
  });
}

export function clearSessionCookies(req: Request, res: Response): void {
  const secure = shouldUseSecureCookies(req);
  const base = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/' };

  res.clearCookie(ACCESS_TOKEN_COOKIE, base);
  res.clearCookie(REFRESH_TOKEN_COOKIE, base);
  // Legacy path from earlier builds
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...base, path: '/api/auth' });
}
