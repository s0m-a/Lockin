import { z } from 'zod';

export const examTypeEnum = z.preprocess(
  (val) => {
    if (typeof val === 'string' && val.trim().length > 0) {
      const lower = val.trim().toLowerCase();
      if (['exam', 'midterm', 'quiz', 'assignment'].includes(lower)) return lower;
    }
    return val;
  },
  z.enum(['exam', 'midterm', 'quiz', 'assignment'])
);

const baseExamSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  subject: z.string().min(1, 'Subject is required').max(100),
  examType: examTypeEnum,
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.preprocess(
    (val) => (val === null || val === '' ? null : val),
    z.string().max(200).nullable().optional()
  ),
  seatNumber: z.preprocess(
    (val) => (val === null || val === '' ? null : val),
    z.string().max(50).nullable().optional()
  ),
  weightage: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? null : Number(val)),
    z.number().int().min(0).max(100).nullable().optional()
  ),
  notes: z.preprocess(
    (val) => (val === null || val === '' ? null : val),
    z.string().max(3000).nullable().optional()
  ),
  isCompleted: z.preprocess(
    (val) => (val === undefined ? undefined : val === 'true' || val === true),
    z.boolean()
  ),
  topics: z.array(z.string().min(1).max(200)).optional(),
});

export const createExamSchema = baseExamSchema.extend({
  examType: examTypeEnum.default('exam'),
  isCompleted: z.preprocess(
    (val) => (val === undefined ? undefined : val === 'true' || val === true),
    z.boolean().default(false)
  ),
});

export const updateExamSchema = baseExamSchema.partial();



export const examQuerySchema = z.object({
  isCompleted: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  examType: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.enum(['exam', 'midterm', 'quiz', 'assignment']).optional()
  ),
  subject: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.string().optional()
  ),
});

export const createTopicSchema = z.object({
  title: z.string().min(1, 'Topic title is required').max(200),
});

export const updateTopicSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isDone: z.boolean().optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type ExamQueryInput = z.infer<typeof examQuerySchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
