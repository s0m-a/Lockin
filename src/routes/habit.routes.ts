import { Router } from 'express';
import * as HabitController from '../controllers/habit.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createHabitSchema,
  updateHabitSchema,
  toggleHabitDaySchema,
} from '../validators/habit.validator';

const router = Router();

router.use(authenticate);

router.get('/', HabitController.getHabits);
router.post('/', validate(createHabitSchema), HabitController.createHabit);
router.put('/:id', validate(updateHabitSchema), HabitController.updateHabit);
router.patch('/:id/toggle', validate(toggleHabitDaySchema), HabitController.toggleHabitDay);
router.delete('/:id', HabitController.deleteHabit);

export default router;
