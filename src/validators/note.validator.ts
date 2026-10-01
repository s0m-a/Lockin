import { z } from 'zod';
import { categoryEnum } from './event.validator';

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

// ─── Create Note ──────────────────────────────────────────────────────────────
export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  content: z.preprocess((v) => (v === null ? '' : v), z.string().default('')),
  category: categoryEnum,
  tags: z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(z.string().max(50)).max(20).default([])
  ),
  isPinned: z.preprocess((v) => Boolean(v), z.boolean().default(false)),
  color: z.preprocess(
    (v) => (v === null || v === '' ? undefined : v),
    z.string().regex(hexColorRegex, 'color must be a 6-digit hex code').optional()
  ),
});

// ─── Update Note ──────────────────────────────────────────────────────────────
export const updateNoteSchema = createNoteSchema.partial();

// ─── Query Filters ────────────────────────────────────────────────────────────
export const noteQuerySchema = z.object({
  category: categoryEnum.optional(),
  isPinned: z.preprocess(
    (v) => (v === 'true' || v === true ? true : v === 'false' || v === false ? false : undefined),
    z.boolean().optional()
  ),
  search: z.preprocess(
    (v) => (v === null || v === '' ? undefined : v),
    z.string().max(200).optional()
  ),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteQueryInput = z.infer<typeof noteQuerySchema>;
