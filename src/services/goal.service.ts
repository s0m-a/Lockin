import { query } from '../config/database';
import { createHttpError } from '../middleware/error.middleware';
import { GoalRow, MilestoneRow } from '../types/db.types';
import {
  CreateGoalInput,
  UpdateGoalInput,
  PatchGoalProgressInput,
  GoalQueryInput,
  CreateMilestoneInput,
} from '../validators/goal.validator';

const GOALS_TABLE     = 'goals';
const MILESTONE_TABLE = 'goal_milestones';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function assertGoalOwner(goalId: string, userId: string): Promise<GoalRow> {
  const { rows } = await query<GoalRow>(
    `SELECT * FROM ${GOALS_TABLE} WHERE id = $1 LIMIT 1`,
    [goalId]
  );
  if (!rows[0]) throw createHttpError(404, 'Goal not found');
  if (rows[0].user_id !== userId) throw createHttpError(403, 'Forbidden');
  return rows[0];
}

async function assertMilestoneOwner(
  milestoneId: string,
  goalId: string
): Promise<MilestoneRow> {
  const { rows } = await query<MilestoneRow>(
    `SELECT * FROM ${MILESTONE_TABLE} WHERE id = $1 AND goal_id = $2 LIMIT 1`,
    [milestoneId, goalId]
  );
  if (!rows[0]) throw createHttpError(404, 'Milestone not found');
  return rows[0];
}

/**
 * Recalculate goal progress from milestone completion ratio.
 * Auto-completes/re-opens the goal based on result.
 */
async function recalculateGoalProgress(goalId: string): Promise<void> {
  const { rows } = await query<{ total: string; done: string }>(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE is_done = TRUE) AS done
     FROM ${MILESTONE_TABLE}
     WHERE goal_id = $1`,
    [goalId]
  );
  const total = parseInt(rows[0]?.total ?? '0', 10);
  if (total === 0) return;  // no milestones → don't touch manual progress

  const done     = parseInt(rows[0]?.done ?? '0', 10);
  const progress = Math.round((done / total) * 100);

  const status      = progress === 100 ? 'completed' : 'active';
  const completedAt = progress === 100 ? new Date().toISOString() : null;

  await query(
    `UPDATE ${GOALS_TABLE}
     SET progress = $1, status = $2, completed_at = $3
     WHERE id = $4`,
    [progress, status, completedAt, goalId]
  );
}

// ─── Get All Goals ────────────────────────────────────────────────────────────
export async function getGoals(
  userId: string,
  filters: GoalQueryInput
): Promise<GoalRow[]> {
  const conditions: string[] = ['user_id = $1'];
  const values: unknown[]    = [userId];
  let i = 2;

  if (filters.status)   { conditions.push(`status = $${i++}`);   values.push(filters.status); }
  if (filters.category) { conditions.push(`category = $${i++}`); values.push(filters.category); }

  const { rows } = await query<GoalRow>(
    `SELECT * FROM ${GOALS_TABLE}
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC`,
    values
  );
  return rows;
}

// ─── Create Goal ──────────────────────────────────────────────────────────────
export async function createGoal(
  userId: string,
  input: CreateGoalInput
): Promise<GoalRow> {
  const { rows } = await query<GoalRow>(
    `INSERT INTO ${GOALS_TABLE}
       (user_id, title, description, category, status, target_date, progress)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      userId,
      input.title,
      input.description ?? null,
      input.category,
      input.status,
      input.targetDate ?? null,
      input.progress,
    ]
  );
  if (!rows[0]) throw createHttpError(500, 'Failed to create goal');
  return rows[0];
}

// ─── Update Goal ──────────────────────────────────────────────────────────────
export async function updateGoal(
  goalId: string,
  userId: string,
  input: UpdateGoalInput
): Promise<GoalRow> {
  await assertGoalOwner(goalId, userId);

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  const map: [keyof UpdateGoalInput, string][] = [
    ['title',       'title'],
    ['description', 'description'],
    ['category',    'category'],
    ['status',      'status'],
    ['targetDate',  'target_date'],
    ['progress',    'progress'],
  ];

  for (const [jsKey, dbCol] of map) {
    if (input[jsKey] !== undefined) {
      fields.push(`${dbCol} = $${i++}`);
      values.push(input[jsKey]);
    }
  }

  if (fields.length === 0) throw createHttpError(400, 'No fields to update');

  values.push(goalId);
  const { rows } = await query<GoalRow>(
    `UPDATE ${GOALS_TABLE} SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  if (!rows[0]) throw createHttpError(500, 'Failed to update goal');
  return rows[0];
}

// ─── Patch Progress ───────────────────────────────────────────────────────────
export async function patchGoalProgress(
  goalId: string,
  userId: string,
  input: PatchGoalProgressInput
): Promise<GoalRow> {
  await assertGoalOwner(goalId, userId);

  const status      = input.progress === 100 ? 'completed' : 'active';
  const completedAt = input.progress === 100 ? new Date().toISOString() : null;

  const { rows } = await query<GoalRow>(
    `UPDATE ${GOALS_TABLE}
     SET progress = $1, status = $2, completed_at = $3
     WHERE id = $4
     RETURNING *`,
    [input.progress, status, completedAt, goalId]
  );
  if (!rows[0]) throw createHttpError(500, 'Failed to update goal progress');
  return rows[0];
}

// ─── Delete Goal ──────────────────────────────────────────────────────────────
export async function deleteGoal(goalId: string, userId: string): Promise<void> {
  await assertGoalOwner(goalId, userId);
  // ON DELETE CASCADE in schema handles milestones
  await query(`DELETE FROM ${GOALS_TABLE} WHERE id = $1`, [goalId]);
}

// ─── Add Milestone ────────────────────────────────────────────────────────────
export async function addMilestone(
  goalId: string,
  userId: string,
  input: CreateMilestoneInput
): Promise<MilestoneRow> {
  await assertGoalOwner(goalId, userId);

  const { rows } = await query<MilestoneRow>(
    `INSERT INTO ${MILESTONE_TABLE} (goal_id, title) VALUES ($1, $2) RETURNING *`,
    [goalId, input.title]
  );
  if (!rows[0]) throw createHttpError(500, 'Failed to add milestone');
  return rows[0];
}

// ─── Toggle Milestone isDone ──────────────────────────────────────────────────
export async function toggleMilestone(
  goalId: string,
  milestoneId: string,
  userId: string
): Promise<{ milestone: MilestoneRow; goal: GoalRow }> {
  const goal      = await assertGoalOwner(goalId, userId);
  const milestone = await assertMilestoneOwner(milestoneId, goalId);

  const nowDone     = !milestone.is_done;
  const completedAt = nowDone ? new Date().toISOString() : null;

  const { rows: mRows } = await query<MilestoneRow>(
    `UPDATE ${MILESTONE_TABLE}
     SET is_done = $1, completed_at = $2
     WHERE id = $3
     RETURNING *`,
    [nowDone, completedAt, milestoneId]
  );
  if (!mRows[0]) throw createHttpError(500, 'Failed to toggle milestone');

  await recalculateGoalProgress(goalId);

  // Fetch fresh goal data after recalculation
  const { rows: gRows } = await query<GoalRow>(
    `SELECT * FROM ${GOALS_TABLE} WHERE id = $1`,
    [goalId]
  );

  return { milestone: mRows[0], goal: gRows[0] ?? goal };
}

// ─── Delete Milestone ─────────────────────────────────────────────────────────
export async function deleteMilestone(
  goalId: string,
  milestoneId: string,
  userId: string
): Promise<void> {
  await assertGoalOwner(goalId, userId);
  await assertMilestoneOwner(milestoneId, goalId);
  await query(`DELETE FROM ${MILESTONE_TABLE} WHERE id = $1`, [milestoneId]);
  await recalculateGoalProgress(goalId);
}

// ─── Get Milestones ───────────────────────────────────────────────────────────
export async function getMilestones(
  goalId: string,
  userId: string
): Promise<MilestoneRow[]> {
  await assertGoalOwner(goalId, userId);

  const { rows } = await query<MilestoneRow>(
    `SELECT * FROM ${MILESTONE_TABLE} WHERE goal_id = $1 ORDER BY created_at ASC`,
    [goalId]
  );
  return rows;
}
