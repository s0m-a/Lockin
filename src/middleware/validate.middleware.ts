import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

/**
 * Returns an Express middleware that validates `req.body` against a Zod schema.
 * On failure it responds with 400 and a structured list of field errors.
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const errors = zodError.issues.map((e: ZodIssue) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Replace req.body with the parsed (and possibly transformed) data
    req.body = result.data;
    next();
  };
}
