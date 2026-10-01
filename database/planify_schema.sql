-- ============================================================
--  lockin – Feature Schema (Events, Tasks, Notes, Goals)
--  For AWS RDS PostgreSQL (plain Postgres, no Supabase extensions)
--  Run AFTER schema.sql
-- ============================================================

-- ─── Shared ENUM types ────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE category_enum AS ENUM (
    'work', 'personal', 'study', 'health', 'social', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status_enum AS ENUM ('todo', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_priority_enum AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE goal_status_enum AS ENUM ('active', 'completed', 'abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Timetable Events ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  day          SMALLINT NOT NULL CHECK (day BETWEEN 0 AND 6),
  start_time   TEXT NOT NULL,
  end_time     TEXT NOT NULL,
  location     TEXT,
  category     category_enum NOT NULL DEFAULT 'other',
  color        TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_event_times CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON timetable_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_day     ON timetable_events(user_id, day);

CREATE OR REPLACE TRIGGER timetable_events_set_updated_at
  BEFORE UPDATE ON timetable_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Tasks ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  status       task_status_enum NOT NULL DEFAULT 'todo',
  priority     task_priority_enum NOT NULL DEFAULT 'medium',
  due_date     TIMESTAMPTZ,
  category     category_enum NOT NULL DEFAULT 'other',
  tags         TEXT[] NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id  ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(user_id, due_date);

CREATE OR REPLACE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Notes ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  category   category_enum NOT NULL DEFAULT 'other',
  tags       TEXT[] NOT NULL DEFAULT '{}',
  is_pinned  BOOLEAN NOT NULL DEFAULT FALSE,
  color      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_pinned  ON notes(user_id, is_pinned);

-- GIN index for Postgres full-text search on title + content
CREATE INDEX IF NOT EXISTS idx_notes_fts ON notes
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

CREATE OR REPLACE TRIGGER notes_set_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Goals ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  category     category_enum NOT NULL DEFAULT 'other',
  status       goal_status_enum NOT NULL DEFAULT 'active',
  target_date  TIMESTAMPTZ,
  progress     SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status  ON goals(user_id, status);

CREATE OR REPLACE TRIGGER goals_set_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Goal Milestones ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goal_milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id      UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  is_done      BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON goal_milestones(goal_id);

CREATE OR REPLACE TRIGGER goal_milestones_set_updated_at
  BEFORE UPDATE ON goal_milestones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Exams / Assessments ──────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE exam_type_enum AS ENUM ('exam', 'midterm', 'quiz', 'assignment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS exams (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  subject      TEXT NOT NULL,
  exam_type    exam_type_enum NOT NULL DEFAULT 'exam',
  date         TIMESTAMPTZ NOT NULL,
  start_time   TEXT NOT NULL,
  end_time     TEXT NOT NULL,
  location     TEXT,
  seat_number  TEXT,
  weightage    SMALLINT CHECK (weightage >= 0 AND weightage <= 100),
  notes        TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_user_id ON exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_date    ON exams(user_id, date);

CREATE OR REPLACE TRIGGER exams_set_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Exam Topics / Revision Checklist ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_topics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id      UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  is_done      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_topics_exam_id ON exam_topics(exam_id);

CREATE OR REPLACE TRIGGER exam_topics_set_updated_at
  BEFORE UPDATE ON exam_topics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

