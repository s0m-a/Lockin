import { Request, Response, NextFunction } from 'express';

// ─── Error Codes ─────────────────────────────────────────────────────────────
const HTTP_CODE_MAP: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
};

// ─── AppError ─────────────────────────────────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code ?? HTTP_CODE_MAP[statusCode] ?? 'ERROR';
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Convenience factory — use this everywhere instead of `new AppError()` */
export function createHttpError(
  statusCode: number,
  message: string,
  code?: string
): AppError {
  return new AppError(statusCode, message, code);
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
/**
 * Must be registered LAST in Express with 4 params.
 * Returns the standardised envelope:
 *   { success: false, message: string, code: string }
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code:    err.code,
    });
    return;
  }

  // Unhandled / unexpected error
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code:    'INTERNAL_SERVER_ERROR',
  });
}
