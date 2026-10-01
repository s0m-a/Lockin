import { Request, Response, NextFunction } from 'express';
import * as TaskService from '../services/task.service';
import { taskQuerySchema } from '../validators/task.validator';
import { param } from '../utils/param.util';

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
export async function getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filtersResult = taskQuerySchema.safeParse(req.query);
    const filters = filtersResult.success ? filtersResult.data : {};

    const tasks = await TaskService.getTasks(req.user!.sub, filters);
    res.status(200).json({ success: true, data: { tasks } });
  } catch (err) { next(err); }
}

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await TaskService.createTask(req.user!.sub, req.body);
    res.status(201).json({ success: true, data: { task } });
  } catch (err) { next(err); }
}

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await TaskService.updateTask(param(req, 'id'), req.user!.sub, req.body);
    res.status(200).json({ success: true, data: { task } });
  } catch (err) { next(err); }
}

// ─── PATCH /api/tasks/:id/status ─────────────────────────────────────────────
export async function patchTaskStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await TaskService.patchTaskStatus(param(req, 'id'), req.user!.sub, req.body);
    res.status(200).json({ success: true, data: { task } });
  } catch (err) { next(err); }
}

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await TaskService.deleteTask(param(req, 'id'), req.user!.sub);
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (err) { next(err); }
}
