import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createGoalSchema,
  updateGoalSchema,
  patchGoalProgressSchema,
  createMilestoneSchema,
} from '../validators/goal.validator';
import * as GoalController from '../controllers/goal.controller';

const router = Router();

router.use(authenticate);

/**
 * @route  GET /api/goals
 * @desc   Get all goals. Supports ?status, ?category
 * @access Protected
 */
router.get('/', GoalController.getGoals);

/**
 * @route  POST /api/goals
 * @desc   Create a new goal
 * @access Protected
 */
router.post('/', validate(createGoalSchema), GoalController.createGoal);

/**
 * @route  PUT /api/goals/:id
 * @desc   Full update of a goal
 * @access Protected
 */
router.put('/:id', validate(updateGoalSchema), GoalController.updateGoal);

/**
 * @route  PATCH /api/goals/:id/progress
 * @desc   Update goal progress (0–100). Auto-completes at 100.
 * @access Protected
 */
router.patch('/:id/progress', validate(patchGoalProgressSchema), GoalController.patchGoalProgress);

/**
 * @route  DELETE /api/goals/:id
 * @desc   Delete a goal (cascades to milestones)
 * @access Protected
 */
router.delete('/:id', GoalController.deleteGoal);

// ─── Milestone Sub-Routes ─────────────────────────────────────────────────────

/**
 * @route  GET /api/goals/:id/milestones
 * @desc   List all milestones for a goal
 * @access Protected
 */
router.get('/:id/milestones', GoalController.getMilestones);

/**
 * @route  POST /api/goals/:id/milestones
 * @desc   Add a milestone to a goal
 * @access Protected
 */
router.post('/:id/milestones', validate(createMilestoneSchema), GoalController.addMilestone);

/**
 * @route  PATCH /api/goals/:id/milestones/:milestoneId
 * @desc   Toggle milestone isDone; recalculates parent goal progress
 * @access Protected
 */
router.patch('/:id/milestones/:milestoneId', GoalController.toggleMilestone);

/**
 * @route  DELETE /api/goals/:id/milestones/:milestoneId
 * @desc   Delete a milestone; recalculates parent goal progress
 * @access Protected
 */
router.delete('/:id/milestones/:milestoneId', GoalController.deleteMilestone);

export default router;
