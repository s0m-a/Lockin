import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../utils/jwt.util';

// ─── Extend Express Request ───────────────────────────────────────────────────
// Adds a typed `user` property so controllers can access the authenticated user.
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

/**
 * Authentication Guard Middleware
 *
 * Reads the Bearer token from the Authorization header, verifies it, and
 * injects the decoded payload into `req.user`.
 *
 * Usage:
 *   router.get('/protected', authenticate, (req, res) => {
 *     res.json({ userId: req.user!.sub });
 *   });
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'No access token provided',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);

    // Extra guard: make sure this really is an access token
    if (payload.type !== 'access') {
      throw new Error('Wrong token type');
    }

    req.user = payload; // inject into request context
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
    });
  }
}
