import { query } from '../config/database';
import { createHttpError } from '../middleware/error.middleware';
import { TaskRow } from '../types/db.types';
import {
  CreateTaskInput,
  UpdateTaskInput,
  PatchTaskStatusInput,
  TaskQueryInput,
} from '../validators/task.validator';

const TABLE = 'tasks';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function assertOwner(taskId: string, userId: string): Promise<TaskRow> {
  const { rows } = await query<TaskRow>(
    `SELECT * FROM ${TABLE} WHERE id = $1 LIMIT 1`,
    [taskId]
  );
  if (!rows[0]) throw createHttpError(404, 'Task not found');
  if (rows[0].user_id !== userId) throw createHttpError(403, 'Forbidden');
  return rows[0];
}

// ─── Get All (with filters) ───────────────────────────────────────────────────
export async function getTasks(
  userId: string,
  filters: TaskQueryInput
): Promise<TaskRow[]> {
  const conditions: string[] = ['user_id = $1'];
  const values: unknown[]    = [userId];
  let i = 2;

  if (filters.status)   { conditions.push(`status = $${i++}`);   values.push(filters.status); }
  if (filters.priority) { conditions.push(`priority = $${i++}`); values.push(filters.priority); }
  if (filters.category) { conditions.push(`category = $${i++}`); values.push(filters.category); }

  if (filters.search) {
    conditions.push(`(title ILIKE $${i} OR description ILIKE $${i})`);
    values.push(`%${filters.search}%`);
    i++;
  }

  if (filters.dueDate) {
    // Match the full calendar day in UTC
    conditions.push(`due_date >= $${i++}::timestamptz`);
    conditions.push(`due_date < $${i++}::timestamptz`);
    values.push(`${filters.dueDate}T00:00:00.000Z`);
    values.push(`${filters.dueDate}T00:00:00.000Z`);
    // Advance the end to the next day
    const nextDay = new Date(`${filters.dueDate}T00:00:00.000Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    values[values.length - 1] = nextDay.toISOString();
  }

  const { rows } = await query<TaskRow>(
    `SELECT * FROM ${TABLE}
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC`,
    values
  );
  return rows;
}

// ─── Create ───────────────────────────────────────────────────────────────────
export async function createTask(
  userId: string,
  input: CreateTaskInput
): Promise<TaskRow> {
  const { rows } = await query<TaskRow>(
    `INSERT INTO ${TABLE}
       (user_id, title, description, status, priority, due_date, category, tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      userId,
      input.title,
      input.description ?? null,
      input.status,
      input.priority,
      input.dueDate ?? null,
      input.category,
      input.tags,
    ]
  );
  if (!rows[0]) throw createHttpError(500, 'Failed to create task');
  return rows[0];
}

// ─── Update ───────────────────────────────────────────────────────────────────
export async function updateTask(
  taskId: string,
  userId: string,
  input: UpdateTaskInput
): Promise<TaskRow> {
  const existing = await assertOwner(taskId, userId);

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  const map: [keyof UpdateTaskInput, string][] = [
    ['title',       'title'],
    ['description', 'description'],
    ['status',      'status'],
    ['priority',    'priority'],
    ['dueDate',     'due_date'],
    ['category',    'category'],
    ['tags',        'tags'],
  ];

  for (const [jsKey, dbCol] of map) {
    if (input[jsKey] !== undefined) {
      fields.push(`${dbCol} = $${i++}`);
      values.push(input[jsKey]);
    }
  }

  // Auto-manage completedAt based on status transition
  const newStatus = input.status ?? existing.status;
  if (newStatus === 'done' && existing.status !== 'done') {
    fields.push(`completed_at = $${i++}`);
    values.push(new Date().toISOString());
  } else if (newStatus !== 'done' && existing.status === 'done') {
    fields.push(`completed_at = NULL`);
  }

  if (fields.length === 0) throw createHttpError(400, 'No fields to update');

  values.push(taskId);
  const { rows } = await query<TaskRow>(
    `UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  if (!rows[0]) throw createHttpError(500, 'Failed to update task');
  return rows[0];
}

// ─── Patch Status ─────────────────────────────────────────────────────────────
export async function patchTaskStatus(
  taskId: string,
  userId: string,
  input: PatchTaskStatusInput
): Promise<TaskRow> {
  await assertOwner(taskId, userId);

  const completedAt = input.status === 'done' ? new Date().toISOString() : null;

  const { rows } = await query<TaskRow>(
    `UPDATE ${TABLE}
     SET status = $1, completed_at = $2
     WHERE id = $3
     RETURNING *`,
    [input.status, completedAt, taskId]
  );
  if (!rows[0]) throw createHttpError(500, 'Failed to update task status');
  return rows[0];
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export async function deleteTask(taskId: string, userId: string): Promise<void> {
  await assertOwner(taskId, userId);
  await query(`DELETE FROM ${TABLE} WHERE id = $1`, [taskId]);
}
