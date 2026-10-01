import { Request } from 'express';

/**
 * Safely extract a string URL param from `req.params`.
 * Express types params as `string | string[]`; route params are always strings,
 * so this cast is safe and avoids repetitive "as string" noise in controllers.
 */
export function param(req: Request, name: string): string {
  return req.params[name] as string;
}
