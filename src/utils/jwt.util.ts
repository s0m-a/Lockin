import { createHash, randomUUID } from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AccessTokenPayload {
  sub: string;   // user UUID
  email: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;         // user UUID
  familyId: string;    // rotation family – detects reuse attacks
  jti?: string;
  type: 'refresh';
}

// ─── Token Generation ─────────────────────────────────────────────────────────
export function generateAccessToken(userId: string, email: string): string {
  const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    email,
    type: 'access',
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function generateRefreshToken(userId: string, familyId: string): string {
  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    familyId,
    jti: randomUUID(),
    type: 'refresh',
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

// ─── Token Verification ───────────────────────────────────────────────────────
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

// ─── Token Hashing ────────────────────────────────────────────────────────────
/**
 * Returns a SHA-256 hex hash of the raw JWT.
 * We store only this hash in the DB — never the raw token.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
