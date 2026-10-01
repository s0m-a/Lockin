import { z } from 'zod';
import { categoryEnum } from './event.validator';

// ─── Create Goal ──────────────────────────────────────────────────────────────
export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.string().max(2000).optional()
  ),
  category: categoryEnum,
  status: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.trim().length > 0) {
        const lower = val.trim().toLowerCase();
        if (['active', 'completed', 'abandoned'].includes(lower)) return lower;
      }
      return 'active';
    },
    z.enum(['active', 'completed', 'abandoned']).default('active')
  ),
  targetDate: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.string().optional()
  ),
  progress: z.preprocess(
    (val) => (val === undefined || val === null ? 0 : Number(val)),
    z.number().int('Progress must be an integer').min(0).max(100).default(0)
  ),
});

// ─── Update Goal ──────────────────────────────────────────────────────────────
export const updateGoalSchema = createGoalSchema.partial();

// ─── Patch Progress ───────────────────────────────────────────────────────────
export const patchGoalProgressSchema = z.object({
  progress: z.coerce.number().int('Progress must be an integer').min(0).max(100),
});

// ─── Query Filters ────────────────────────────────────────────────────────────
export const goalQuerySchema = z.object({
  status: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.enum(['active', 'completed', 'abandoned']).optional()
  ),
  category: categoryEnum.optional(),
});

// ─── Milestones ───────────────────────────────────────────────────────────────
export const createMilestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title is required').max(200),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type PatchGoalProgressInput = z.infer<typeof patchGoalProgressSchema>;
export type GoalQueryInput = z.infer<typeof goalQuerySchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
