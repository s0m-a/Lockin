import { z } from 'zod';
import { categoryEnum } from './event.validator';

// ─── Create Task ──────────────────────────────────────────────────────────────
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.string().max(2000).optional()
  ),
  status: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.trim().length > 0) {
        const lower = val.trim().toLowerCase();
        if (['todo', 'in_progress', 'done'].includes(lower)) return lower;
      }
      return 'todo';
    },
    z.enum(['todo', 'in_progress', 'done']).default('todo')
  ),
  priority: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.trim().length > 0) {
        const lower = val.trim().toLowerCase();
        if (['low', 'medium', 'high'].includes(lower)) return lower;
      }
      return 'medium';
    },
    z.enum(['low', 'medium', 'high']).default('medium')
  ),
  dueDate: z.preprocess(
    (val) => (val === null || val === '' ? null : val),
    z.string().nullable().optional()
  ),
  category: categoryEnum,
  tags: z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(z.string().max(50)).max(20).default([])
  ),
});

// ─── Update Task ──────────────────────────────────────────────────────────────
export const updateTaskSchema = createTaskSchema.partial();

// ─── Patch Status ─────────────────────────────────────────────────────────────
export const patchTaskStatusSchema = z.object({
  status: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.trim().length > 0) {
        const lower = val.trim().toLowerCase();
        if (['todo', 'in_progress', 'done'].includes(lower)) return lower;
      }
      return 'todo';
    },
    z.enum(['todo', 'in_progress', 'done'])
  ),
});

// ─── Query Filters ────────────────────────────────────────────────────────────
export const taskQuerySchema = z.object({
  status: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.trim().length > 0) {
        const lower = val.trim().toLowerCase();
        if (['todo', 'in_progress', 'done'].includes(lower)) return lower;
      }
      return undefined;
    },
    z.enum(['todo', 'in_progress', 'done']).optional()
  ),
  priority: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.trim().length > 0) {
        const lower = val.trim().toLowerCase();
        if (['low', 'medium', 'high'].includes(lower)) return lower;
      }
      return undefined;
    },
    z.enum(['low', 'medium', 'high']).optional()
  ),
  category: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.trim().length > 0) {
        const lower = val.trim().toLowerCase();
        if (['work', 'personal', 'study', 'health', 'social', 'other'].includes(lower)) return lower;
      }
      return undefined;
    },
    z.enum(['work', 'personal', 'study', 'health', 'social', 'other']).optional()
  ),
  dueDate: z.preprocess(
    (val) => (val === null || val === '' || val === 'all' ? undefined : val),
    z.string().optional()
  ),
  search: z.preprocess(
    (val) => (typeof val === 'string' && val.trim().length > 0 ? val.trim() : undefined),
    z.string().optional()
  ),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type PatchTaskStatusInput = z.infer<typeof patchTaskStatusSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
