import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.middleware';
import { validate } from '../middleware/validate.middleware';
import { createEventSchema, updateEventSchema } from '../validators/event.validator';
import * as EventController from '../controllers/event.controller';

const router = Router();

// All event routes are protected
router.use(authenticate);

/**
 * @route  GET /api/events
 * @desc   Get all events for the authenticated user (ordered by day + startTime)
 * @access Protected
 */
router.get('/', EventController.getEvents);

/**
 * @route  POST /api/events
 * @desc   Create a new timetable event
 * @access Protected
 */
router.post('/', validate(createEventSchema), EventController.createEvent);

/**
 * @route  PUT /api/events/:id
 * @desc   Full update of an event (ownership enforced in service)
 * @access Protected
 */
router.put('/:id', validate(updateEventSchema), EventController.updateEvent);

/**
 * @route  DELETE /api/events/:id
 * @desc   Delete an event (ownership enforced in service)
 * @access Protected
 */
router.delete('/:id', EventController.deleteEvent);

export default router;
