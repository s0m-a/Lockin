import { query } from '../config/database';
import { createHttpError } from '../middleware/error.middleware';
import { NoteRow } from '../types/db.types';
import {
  CreateNoteInput,
  UpdateNoteInput,
  NoteQueryInput,
} from '../validators/note.validator';

const TABLE = 'notes';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function assertOwner(noteId: string, userId: string): Promise<NoteRow> {
  const { rows } = await query<NoteRow>(
    `SELECT * FROM ${TABLE} WHERE id = $1 LIMIT 1`,
    [noteId]
  );
  if (!rows[0]) throw createHttpError(404, 'Note not found');
  if (rows[0].user_id !== userId) throw createHttpError(403, 'Forbidden');
  return rows[0];
}

// ─── Get All (with filters + full-text search) ────────────────────────────────
export async function getNotes(
  userId: string,
  filters: NoteQueryInput
): Promise<NoteRow[]> {
  const conditions: string[] = ['user_id = $1'];
  const values: unknown[]    = [userId];
  let i = 2;

  if (filters.category  !== undefined) {
    conditions.push(`category = $${i++}`);
    values.push(filters.category);
  }
  if (filters.isPinned !== undefined) {
    conditions.push(`is_pinned = $${i++}`);
    values.push(filters.isPinned);
  }
  if (filters.search) {
    // Postgres full-text search using the GIN index on the computed tsvector
    conditions.push(
      `to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')) ` +
      `@@ websearch_to_tsquery('english', $${i++})`
    );
    values.push(filters.search.trim());
  }

  const { rows } = await query<NoteRow>(
    `SELECT * FROM ${TABLE}
     WHERE ${conditions.join(' AND ')}
     ORDER BY is_pinned DESC, updated_at DESC`,
    values
  );
  return rows;
}

// ─── Create ───────────────────────────────────────────────────────────────────
export async function createNote(
  userId: string,
  input: CreateNoteInput
): Promise<NoteRow> {
  const { rows } = await query<NoteRow>(
    `INSERT INTO ${TABLE}
       (user_id, title, content, category, tags, is_pinned, color)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      userId,
      input.title,
      input.content,
      input.category,
      input.tags,
      input.isPinned,
      input.color ?? null,
    ]
  );
  if (!rows[0]) throw createHttpError(500, 'Failed to create note');
  return rows[0];
}

// ─── Update ───────────────────────────────────────────────────────────────────
export async function updateNote(
  noteId: string,
  userId: string,
  input: UpdateNoteInput
): Promise<NoteRow> {
  await assertOwner(noteId, userId);

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  const map: [keyof UpdateNoteInput, string][] = [
    ['title',    'title'],
    ['content',  'content'],
    ['category', 'category'],
    ['tags',     'tags'],
    ['isPinned', 'is_pinned'],
    ['color',    'color'],
  ];

  for (const [jsKey, dbCol] of map) {
    if (input[jsKey] !== undefined) {
      fields.push(`${dbCol} = $${i++}`);
      values.push(input[jsKey]);
    }
  }

  if (fields.length === 0) throw createHttpError(400, 'No fields to update');

  values.push(noteId);
  const { rows } = await query<NoteRow>(
    `UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  if (!rows[0]) throw createHttpError(500, 'Failed to update note');
  return rows[0];
}

// ─── Pin Toggle ───────────────────────────────────────────────────────────────
export async function toggleNotePin(noteId: string, userId: string): Promise<NoteRow> {
  const existing = await assertOwner(noteId, userId);

  const { rows } = await query<NoteRow>(
    `UPDATE ${TABLE} SET is_pinned = $1 WHERE id = $2 RETURNING *`,
    [!existing.is_pinned, noteId]
  );
  if (!rows[0]) throw createHttpError(500, 'Failed to toggle pin');
  return rows[0];
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  await assertOwner(noteId, userId);
  await query(`DELETE FROM ${TABLE} WHERE id = $1`, [noteId]);
}
