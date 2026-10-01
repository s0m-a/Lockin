import { query } from '../config/database';
import { createHttpError } from '../middleware/error.middleware';
import { TimetableEventRow } from '../types/db.types';
import { CreateEventInput, UpdateEventInput } from '../validators/event.validator';

const TABLE = 'timetable_events';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function assertOwner(eventId: string, userId: string): Promise<TimetableEventRow> {
  const { rows } = await query<TimetableEventRow>(
    `SELECT * FROM ${TABLE} WHERE id = $1 LIMIT 1`,
    [eventId]
  );
  if (!rows[0]) throw createHttpError(404, 'Event not found');
  if (rows[0].user_id !== userId) throw createHttpError(403, 'Forbidden');
  return rows[0];
}

// ─── Get All ──────────────────────────────────────────────────────────────────
export async function getEvents(userId: string): Promise<TimetableEventRow[]> {
  const { rows } = await query<TimetableEventRow>(
    `SELECT * FROM ${TABLE}
     WHERE user_id = $1
     ORDER BY day ASC, start_time ASC`,
    [userId]
  );
  return rows;
}

// ─── Create ───────────────────────────────────────────────────────────────────
export async function createEvent(
  userId: string,
  input: CreateEventInput
): Promise<TimetableEventRow> {
  const { rows } = await query<TimetableEventRow>(
    `INSERT INTO ${TABLE}
       (user_id, title, description, day, start_time, end_time,
        location, category, color, is_recurring)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      userId,
      input.title,
      input.description ?? null,
      input.day,
      input.startTime,
      input.endTime,
      input.location ?? null,
      input.category,
      input.color ?? null,
      input.isRecurring,
    ]
  );
  if (!rows[0]) throw createHttpError(500, 'Failed to create event');
  return rows[0];
}

// ─── Update ───────────────────────────────────────────────────────────────────
export async function updateEvent(
  eventId: string,
  userId: string,
  input: UpdateEventInput
): Promise<TimetableEventRow> {
  await assertOwner(eventId, userId);

  // Build dynamic SET clause from only the fields provided
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  const map: [keyof UpdateEventInput, string][] = [
    ['title',       'title'],
    ['description', 'description'],
    ['day',         'day'],
    ['startTime',   'start_time'],
    ['endTime',     'end_time'],
    ['location',    'location'],
    ['category',    'category'],
    ['color',       'color'],
    ['isRecurring', 'is_recurring'],
  ];

  for (const [jsKey, dbCol] of map) {
    if (input[jsKey] !== undefined) {
      fields.push(`${dbCol} = $${i++}`);
      values.push(input[jsKey]);
    }
  }

  if (fields.length === 0) throw createHttpError(400, 'No fields to update');

  values.push(eventId);
  const { rows } = await query<TimetableEventRow>(
    `UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  if (!rows[0]) throw createHttpError(500, 'Failed to update event');
  return rows[0];
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export async function deleteEvent(eventId: string, userId: string): Promise<void> {
  await assertOwner(eventId, userId);
  await query(`DELETE FROM ${TABLE} WHERE id = $1`, [eventId]);
}
