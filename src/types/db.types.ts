// ─── Shared DB row types used across services ─────────────────────────────────

export type Category =
  | 'work'
  | 'personal'
  | 'study'
  | 'health'
  | 'social'
  | 'other';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type GoalStatus = 'active' | 'completed' | 'abandoned';

// ─── DB Row Shapes ────────────────────────────────────────────────────────────
export interface UserRow {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimetableEventRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  day: number;
  start_time: string;
  end_time: string;
  location: string | null;
  category: Category;
  color: string | null;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  category: Category;
  tags: string[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: Category;
  tags: string[];
  is_pinned: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: Category;
  status: GoalStatus;
  target_date: string | null;
  progress: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MilestoneRow {
  id: string;
  goal_id: string;
  title: string;
  is_done: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ExamType = 'exam' | 'midterm' | 'quiz' | 'assignment';

export interface ExamRow {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  exam_type: ExamType;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  seat_number: string | null;
  weightage: number | null;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamTopicRow {
  id: string;
  exam_id: string;
  title: string;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamWithTopics extends ExamRow {
  topics: ExamTopicRow[];
}

