import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  patchTaskStatusSchema,
} from '../validators/task.validator';
import * as TaskController from '../controllers/task.controller';

const router = Router();

router.use(authenticate);

/**
 * @route  GET /api/tasks
 * @desc   Get all tasks. Supports ?status, ?priority, ?category, ?dueDate
 * @access Protected
 */
router.get('/', TaskController.getTasks);

/**
 * @route  POST /api/tasks
 * @desc   Create a new task
 * @access Protected
 */
router.post('/', validate(createTaskSchema), TaskController.createTask);

/**
 * @route  PUT /api/tasks/:id
 * @desc   Full update of a task
 * @access Protected
 */
router.put('/:id', validate(updateTaskSchema), TaskController.updateTask);

/**
 * @route  PATCH /api/tasks/:id/status
 * @desc   Update only the status; auto-sets completedAt when done
 * @access Protected
 */
router.patch('/:id/status', validate(patchTaskStatusSchema), TaskController.patchTaskStatus);

/**
 * @route  DELETE /api/tasks/:id
 * @desc   Delete a task
 * @access Protected
 */
router.delete('/:id', TaskController.deleteTask);

export default router;
