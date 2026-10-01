import { query } from '../config/database';
import { createHttpError } from '../middleware/error.middleware';
import { ExamRow, ExamTopicRow, ExamWithTopics } from '../types/db.types';
import {
  CreateExamInput,
  UpdateExamInput,
  ExamQueryInput,
  CreateTopicInput,
  UpdateTopicInput,
} from '../validators/exam.validator';

const EXAMS_TABLE = 'exams';
const TOPICS_TABLE = 'exam_topics';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function assertExamOwner(examId: string, userId: string): Promise<ExamRow> {
  const { rows } = await query<ExamRow>(
    `SELECT * FROM ${EXAMS_TABLE} WHERE id = $1 LIMIT 1`,
    [examId]
  );
  if (!rows[0]) throw createHttpError(404, 'Exam not found');
  if (rows[0].user_id !== userId) throw createHttpError(403, 'Forbidden');
  return rows[0];
}

async function assertTopicOwner(
  topicId: string,
  examId: string
): Promise<ExamTopicRow> {
  const { rows } = await query<ExamTopicRow>(
    `SELECT * FROM ${TOPICS_TABLE} WHERE id = $1 AND exam_id = $2 LIMIT 1`,
    [topicId, examId]
  );
  if (!rows[0]) throw createHttpError(404, 'Topic not found');
  return rows[0];
}

// ─── Get All Exams ────────────────────────────────────────────────────────────
export async function getExams(
  userId: string,
  filters: ExamQueryInput
): Promise<ExamWithTopics[]> {
  const conditions: string[] = ['user_id = $1'];
  const values: unknown[] = [userId];
  let i = 2;

  if (filters.isCompleted !== undefined) {
    conditions.push(`is_completed = $${i++}`);
    values.push(filters.isCompleted);
  }
  if (filters.examType) {
    conditions.push(`exam_type = $${i++}`);
    values.push(filters.examType);
  }
  if (filters.subject) {
    conditions.push(`subject ILIKE $${i++}`);
    values.push(`%${filters.subject}%`);
  }

  const { rows: exams } = await query<ExamRow>(
    `SELECT * FROM ${EXAMS_TABLE}
     WHERE ${conditions.join(' AND ')}
     ORDER BY date ASC, start_time ASC`,
    values
  );

  if (exams.length === 0) return [];

  const examIds = exams.map((e) => e.id);
  const { rows: topics } = await query<ExamTopicRow>(
    `SELECT * FROM ${TOPICS_TABLE}
     WHERE exam_id = ANY($1::uuid[])
     ORDER BY created_at ASC`,
    [examIds]
  );

  const topicsByExamId: Record<string, ExamTopicRow[]> = {};
  for (const topic of topics) {
    if (!topicsByExamId[topic.exam_id]) {
      topicsByExamId[topic.exam_id] = [];
    }
    topicsByExamId[topic.exam_id].push(topic);
  }

  return exams.map((exam) => ({
    ...exam,
    topics: topicsByExamId[exam.id] || [],
  }));
}

// ─── Get Exam By ID ───────────────────────────────────────────────────────────
export async function getExamById(
  examId: string,
  userId: string
): Promise<ExamWithTopics> {
  const exam = await assertExamOwner(examId, userId);
  const { rows: topics } = await query<ExamTopicRow>(
    `SELECT * FROM ${TOPICS_TABLE} WHERE exam_id = $1 ORDER BY created_at ASC`,
    [examId]
  );
  return {
    ...exam,
    topics,
  };
}

// ─── Create Exam ──────────────────────────────────────────────────────────────
export async function createExam(
  userId: string,
  input: CreateExamInput
): Promise<ExamWithTopics> {
  const {
    title,
    subject,
    examType = 'exam',
    date,
    startTime,
    endTime,
    location,
    seatNumber,
    weightage,
    notes,
    isCompleted = false,
    topics = [],
  } = input;

  const { rows: examRows } = await query<ExamRow>(
    `INSERT INTO ${EXAMS_TABLE} (
       user_id, title, subject, exam_type, date,
       start_time, end_time, location, seat_number,
       weightage, notes, is_completed
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      userId,
      title,
      subject,
      examType,
      date,
      startTime,
      endTime,
      location ?? null,
      seatNumber ?? null,
      weightage ?? null,
      notes ?? null,
      isCompleted,
    ]
  );

  const exam = examRows[0];
  const insertedTopics: ExamTopicRow[] = [];

  if (topics && topics.length > 0) {
    for (const topicTitle of topics) {
      if (topicTitle.trim().length > 0) {
        const { rows: topicRows } = await query<ExamTopicRow>(
          `INSERT INTO ${TOPICS_TABLE} (exam_id, title)
           VALUES ($1, $2)
           RETURNING *`,
          [exam.id, topicTitle.trim()]
        );
        if (topicRows[0]) insertedTopics.push(topicRows[0]);
      }
    }
  }

  return {
    ...exam,
    topics: insertedTopics,
  };
}

// ─── Update Exam ──────────────────────────────────────────────────────────────
export async function updateExam(
  examId: string,
  userId: string,
  input: UpdateExamInput
): Promise<ExamWithTopics> {
  await assertExamOwner(examId, userId);

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (input.title !== undefined) {
    fields.push(`title = $${i++}`);
    values.push(input.title);
  }
  if (input.subject !== undefined) {
    fields.push(`subject = $${i++}`);
    values.push(input.subject);
  }
  if (input.examType !== undefined) {
    fields.push(`exam_type = $${i++}`);
    values.push(input.examType);
  }
  if (input.date !== undefined) {
    fields.push(`date = $${i++}`);
    values.push(input.date);
  }
  if (input.startTime !== undefined) {
    fields.push(`start_time = $${i++}`);
    values.push(input.startTime);
  }
  if (input.endTime !== undefined) {
    fields.push(`end_time = $${i++}`);
    values.push(input.endTime);
  }
  if (input.location !== undefined) {
    fields.push(`location = $${i++}`);
    values.push(input.location ?? null);
  }
  if (input.seatNumber !== undefined) {
    fields.push(`seat_number = $${i++}`);
    values.push(input.seatNumber ?? null);
  }
  if (input.weightage !== undefined) {
    fields.push(`weightage = $${i++}`);
    values.push(input.weightage ?? null);
  }
  if (input.notes !== undefined) {
    fields.push(`notes = $${i++}`);
    values.push(input.notes ?? null);
  }
  if (input.isCompleted !== undefined) {
    fields.push(`is_completed = $${i++}`);
    values.push(input.isCompleted);
  }

  if (fields.length > 0) {
    values.push(examId);
    await query(
      `UPDATE ${EXAMS_TABLE}
       SET ${fields.join(', ')}
       WHERE id = $${i}`,
      values
    );
  }

  return getExamById(examId, userId);
}

// ─── Delete Exam ──────────────────────────────────────────────────────────────
export async function deleteExam(examId: string, userId: string): Promise<void> {
  await assertExamOwner(examId, userId);
  await query(`DELETE FROM ${EXAMS_TABLE} WHERE id = $1`, [examId]);
}

// ─── Topic Management ─────────────────────────────────────────────────────────
export async function getTopics(
  examId: string,
  userId: string
): Promise<ExamTopicRow[]> {
  await assertExamOwner(examId, userId);
  const { rows } = await query<ExamTopicRow>(
    `SELECT * FROM ${TOPICS_TABLE} WHERE exam_id = $1 ORDER BY created_at ASC`,
    [examId]
  );
  return rows;
}

export async function addTopic(
  examId: string,
  userId: string,
  input: CreateTopicInput
): Promise<ExamTopicRow> {
  await assertExamOwner(examId, userId);
  const { rows } = await query<ExamTopicRow>(
    `INSERT INTO ${TOPICS_TABLE} (exam_id, title)
     VALUES ($1, $2)
     RETURNING *`,
    [examId, input.title]
  );
  return rows[0];
}

export async function toggleTopic(
  examId: string,
  topicId: string,
  userId: string
): Promise<ExamTopicRow> {
  await assertExamOwner(examId, userId);
  await assertTopicOwner(topicId, examId);

  const { rows } = await query<ExamTopicRow>(
    `UPDATE ${TOPICS_TABLE}
     SET is_done = NOT is_done
     WHERE id = $1 AND exam_id = $2
     RETURNING *`,
    [topicId, examId]
  );
  return rows[0];
}

export async function deleteTopic(
  examId: string,
  topicId: string,
  userId: string
): Promise<void> {
  await assertExamOwner(examId, userId);
  await assertTopicOwner(topicId, examId);
  await query(
    `DELETE FROM ${TOPICS_TABLE} WHERE id = $1 AND exam_id = $2`,
    [topicId, examId]
  );
}
