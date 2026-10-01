import { z } from 'zod';

// ─── Shared Enums ─────────────────────────────────────────────────────────────
export const categoryEnum = z.preprocess(
  (val) => {
    if (typeof val === 'string' && val.trim().length > 0) {
      const lower = val.trim().toLowerCase();
      if (['work', 'personal', 'study', 'health', 'social', 'other'].includes(lower)) {
        return lower;
      }
    }
    return 'other';
  },
  z.enum(['work', 'personal', 'study', 'health', 'social', 'other']).default('other')
);

const timeRegex     = /^([01]\d|2[0-3]):([0-5]\d)$/;
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

// ─── Base object (no refine — so .partial() works) ─────────────────
const eventBaseSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(200),
  description: z.preprocess((v) => (v === null || v === '' ? undefined : v), z.string().max(1000).optional()),
  day:         z.coerce.number().int().min(0, 'Day must be 0–7').max(7, 'Day must be 0–7'),
  startTime:   z.string().regex(timeRegex, 'startTime must be in HH:MM format'),
  endTime:     z.string().regex(timeRegex, 'endTime must be in HH:MM format'),
  location:    z.preprocess((v) => (v === null || v === '' ? undefined : v), z.string().max(300).optional()),
  category:    categoryEnum,
  color:       z.preprocess((v) => (v === null || v === '' ? undefined : v), z.string().regex(hexColorRegex, 'color must be a 6-digit hex code').optional()),
  isRecurring: z.preprocess((v) => Boolean(v), z.boolean().default(false)),
});

// ─── Create Event — requires startTime < endTime ──────────────────────────────
export const createEventSchema = eventBaseSchema.refine(
  (data) => data.startTime < data.endTime,
  { message: 'startTime must be before endTime', path: ['startTime'] }
);

// ─── Update Event — all fields optional, conditional time check ───────────────
export const updateEventSchema = eventBaseSchema.partial().refine(
  (data) => {
    if (data.startTime && data.endTime) return data.startTime < data.endTime;
    return true;
  },
  { message: 'startTime must be before endTime', path: ['startTime'] }
);

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
