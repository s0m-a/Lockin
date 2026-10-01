import { z } from 'zod';

export const createHabitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters').trim(),
  category: z.string().max(50).trim().default('Health'),
  targetDays: z.number().int().min(1).max(7).default(7),
  weeklyProgress: z.array(z.boolean()).length(7).optional(),
  streak: z.number().int().min(0).optional(),
});

export const updateHabitSchema = z.object({
  title: z.string().min(1).max(100).trim().optional(),
  category: z.string().max(50).trim().optional(),
  targetDays: z.number().int().min(1).max(7).optional(),
  weeklyProgress: z.array(z.boolean()).length(7).optional(),
  streak: z.number().int().min(0).optional(),
});

export const toggleHabitDaySchema = z.object({
  dayIndex: z.number().int().min(0).max(6),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type ToggleHabitDayInput = z.infer<typeof toggleHabitDaySchema>;
