import { Request, Response, NextFunction } from 'express';
import * as GoalService from '../services/goal.service';
import { goalQuerySchema } from '../validators/goal.validator';
import { param } from '../utils/param.util';

// ─── GET /api/goals ───────────────────────────────────────────────────────────
export async function getGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filtersResult = goalQuerySchema.safeParse(req.query);
    const filters = filtersResult.success ? filtersResult.data : {};

    const goals = await GoalService.getGoals(req.user!.sub, filters);
    res.status(200).json({ success: true, data: { goals } });
  } catch (err) { next(err); }
}

// ─── POST /api/goals ──────────────────────────────────────────────────────────
export async function createGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const goal = await GoalService.createGoal(req.user!.sub, req.body);
    res.status(201).json({ success: true, data: { goal } });
  } catch (err) { next(err); }
}

// ─── PUT /api/goals/:id ───────────────────────────────────────────────────────
export async function updateGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const goal = await GoalService.updateGoal(param(req, 'id'), req.user!.sub, req.body);
    res.status(200).json({ success: true, data: { goal } });
  } catch (err) { next(err); }
}

// ─── PATCH /api/goals/:id/progress ───────────────────────────────────────────
export async function patchGoalProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const goal = await GoalService.patchGoalProgress(param(req, 'id'), req.user!.sub, req.body);
    res.status(200).json({ success: true, data: { goal } });
  } catch (err) { next(err); }
}

// ─── DELETE /api/goals/:id ────────────────────────────────────────────────────
export async function deleteGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await GoalService.deleteGoal(param(req, 'id'), req.user!.sub);
    res.status(200).json({ success: true, message: 'Goal deleted' });
  } catch (err) { next(err); }
}

// ─── POST /api/goals/:id/milestones ──────────────────────────────────────────
export async function addMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const milestone = await GoalService.addMilestone(param(req, 'id'), req.user!.sub, req.body);
    res.status(201).json({ success: true, data: { milestone } });
  } catch (err) { next(err); }
}

// ─── PATCH /api/goals/:id/milestones/:milestoneId ────────────────────────────
export async function toggleMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await GoalService.toggleMilestone(
      param(req, 'id'),
      param(req, 'milestoneId'),
      req.user!.sub
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

// ─── DELETE /api/goals/:id/milestones/:milestoneId ───────────────────────────
export async function deleteMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await GoalService.deleteMilestone(param(req, 'id'), param(req, 'milestoneId'), req.user!.sub);
    res.status(200).json({ success: true, message: 'Milestone deleted' });
  } catch (err) { next(err); }
}

// ─── GET /api/goals/:id/milestones ───────────────────────────────────────────
export async function getMilestones(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const milestones = await GoalService.getMilestones(param(req, 'id'), req.user!.sub);
    res.status(200).json({ success: true, data: { milestones } });
  } catch (err) { next(err); }
}
