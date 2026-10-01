import { prisma } from '../config/prisma';
import { CreateHabitInput, UpdateHabitInput } from '../validators/habit.validator';
import { createHttpError } from '../middleware/error.middleware';

function formatHabit(h: {
  id: string;
  title: string;
  category: string;
  target_days: number;
  weekly_progress: boolean[];
  streak: number;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: h.id,
    title: h.title,
    category: h.category,
    targetDays: h.target_days,
    weeklyProgress: h.weekly_progress,
    streak: h.streak,
    createdAt: h.created_at,
    updatedAt: h.updated_at,
  };
}

function calculateStreak(progress: boolean[]): number {
  const todayIndex = (new Date().getDay() + 6) % 7;
  let activeStreak = 0;
  for (let i = todayIndex; i >= 0; i--) {
    if (progress[i]) {
      activeStreak++;
    } else {
      break;
    }
  }
  if (activeStreak === 0 && progress.filter(Boolean).length > 0) {
    let count = 0;
    for (let i = progress.length - 1; i >= 0; i--) {
      if (progress[i]) count++;
    }
    return Math.min(count, 7);
  }
  return activeStreak;
}

export async function getHabits(userId: string) {
  const habits = await prisma.habits.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' },
  });

  return { habits: habits.map(formatHabit) };
}

export async function createHabit(userId: string, input: CreateHabitInput) {
  const progress = input.weeklyProgress || [false, false, false, false, false, false, false];
  const initialStreak = input.streak !== undefined ? input.streak : calculateStreak(progress);

  const habit = await prisma.habits.create({
    data: {
      user_id: userId,
      title: input.title,
      category: input.category || 'Health',
      target_days: input.targetDays ?? 7,
      weekly_progress: progress,
      streak: initialStreak,
    },
  });

  return { habit: formatHabit(habit) };
}

export async function updateHabit(userId: string, habitId: string, input: UpdateHabitInput) {
  const existing = await prisma.habits.findFirst({
    where: { id: habitId, user_id: userId },
  });

  if (!existing) {
    throw createHttpError(404, 'Habit not found');
  }

  const updatedProgress = input.weeklyProgress !== undefined ? input.weeklyProgress : existing.weekly_progress;
  const updatedStreak = input.streak !== undefined ? input.streak : (input.weeklyProgress !== undefined ? calculateStreak(updatedProgress) : existing.streak);

  const habit = await prisma.habits.update({
    where: { id: habitId },
    data: {
      title: input.title !== undefined ? input.title : existing.title,
      category: input.category !== undefined ? input.category : existing.category,
      target_days: input.targetDays !== undefined ? input.targetDays : existing.target_days,
      weekly_progress: updatedProgress,
      streak: updatedStreak,
    },
  });

  return { habit: formatHabit(habit) };
}

export async function toggleHabitDay(userId: string, habitId: string, dayIndex: number) {
  const existing = await prisma.habits.findFirst({
    where: { id: habitId, user_id: userId },
  });

  if (!existing) {
    throw createHttpError(404, 'Habit not found');
  }

  const newProgress = [...existing.weekly_progress];
  newProgress[dayIndex] = !newProgress[dayIndex];

  const newStreak = calculateStreak(newProgress);

  const habit = await prisma.habits.update({
    where: { id: habitId },
    data: {
      weekly_progress: newProgress,
      streak: newStreak,
    },
  });

  return { habit: formatHabit(habit) };
}

export async function deleteHabit(userId: string, habitId: string) {
  const existing = await prisma.habits.findFirst({
    where: { id: habitId, user_id: userId },
  });

  if (!existing) {
    throw createHttpError(404, 'Habit not found');
  }

  await prisma.habits.delete({
    where: { id: habitId },
  });

  return { message: 'Habit deleted successfully' };
}
