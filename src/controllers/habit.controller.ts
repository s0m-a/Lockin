import { Request, Response, NextFunction } from 'express';
import * as HabitService from '../services/habit.service';

export async function getHabits(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { habits } = await HabitService.getHabits(req.user!.sub);
    res.status(200).json({
      success: true,
      data: { habits },
    });
  } catch (err) {
    next(err);
  }
}

export async function createHabit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { habit } = await HabitService.createHabit(req.user!.sub, req.body);
    res.status(201).json({
      success: true,
      message: 'Habit created successfully',
      data: { habit },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateHabit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const habitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { habit } = await HabitService.updateHabit(
      req.user!.sub,
      habitId,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Habit updated successfully',
      data: { habit },
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleHabitDay(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const habitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { habit } = await HabitService.toggleHabitDay(
      req.user!.sub,
      habitId,
      req.body.dayIndex
    );
    res.status(200).json({
      success: true,
      message: 'Habit progress updated',
      data: { habit },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteHabit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const habitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { message } = await HabitService.deleteHabit(
      req.user!.sub,
      habitId
    );
    res.status(200).json({
      success: true,
      message,
    });
  } catch (err) {
    next(err);
  }
}
