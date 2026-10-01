import { env, isProduction } from '../config/env';
import { CookieOptions, Response } from 'express';

const REFRESH_TOKEN_COOKIE = 'lockin_refresh_token';

/** Cookie options — Secure is only set in production (http in dev) */
const cookieOptions: CookieOptions = {
  httpOnly: true,                     // invisible to JavaScript
  secure: isProduction,               // HTTPS only in production
  sameSite: 'strict',                 // prevent CSRF
  path: '/api/auth',                  // only sent to auth routes
  // maxAge mirrors the JWT expiry — parse "7d" → milliseconds
  maxAge: parseDuration(env.JWT_REFRESH_EXPIRES_IN),
};

/**
 * Attach the refresh token as an HttpOnly cookie on the response.
 */
export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, cookieOptions);
}

/**
 * Clear the refresh token cookie (used on logout).
 */
export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...cookieOptions, maxAge: 0 });
}

/**
 * Read the refresh token from the incoming cookie jar.
 */
export function getRefreshTokenFromCookie(
  cookies: Record<string, string>
): string | undefined {
  return cookies[REFRESH_TOKEN_COOKIE];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseDuration(duration: string): number {
  const units: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 86_400_000; // fallback: 7 days
  return parseInt(match[1], 10) * units[match[2]];
}
