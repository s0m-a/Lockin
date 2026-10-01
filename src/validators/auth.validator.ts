import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .trim(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required').trim(),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_ ]+$/, 'Username can only contain letters, numbers, spaces and underscores')
    .trim()
    .optional(),
  studentEmail: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim()
    .or(z.literal(''))
    .optional(),
  major: z.string().max(100).trim().optional(),
  theme: z.string().max(50).trim().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
