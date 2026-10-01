import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createExamSchema,
  updateExamSchema,
  createTopicSchema,
} from '../validators/exam.validator';
import * as ExamController from '../controllers/exam.controller';

const router = Router();

router.use(authenticate);

/**
 * @route  GET /api/exams
 * @desc   Get all exams with topics. Supports ?isCompleted, ?examType, ?subject
 * @access Protected
 */
router.get('/', ExamController.getExams);

/**
 * @route  GET /api/exams/:id
 * @desc   Get a single exam by ID
 * @access Protected
 */
router.get('/:id', ExamController.getExamById);

/**
 * @route  POST /api/exams
 * @desc   Create a new exam
 * @access Protected
 */
router.post('/', validate(createExamSchema), ExamController.createExam);

/**
 * @route  PUT /api/exams/:id
 * @desc   Update an exam
 * @access Protected
 */
router.put('/:id', validate(updateExamSchema), ExamController.updateExam);

/**
 * @route  DELETE /api/exams/:id
 * @desc   Delete an exam (cascades to topics)
 * @access Protected
 */
router.delete('/:id', ExamController.deleteExam);

// ─── Topic Sub-Routes ─────────────────────────────────────────────────────────

/**
 * @route  GET /api/exams/:id/topics
 * @desc   Get all topics for an exam
 * @access Protected
 */
router.get('/:id/topics', ExamController.getTopics);

/**
 * @route  POST /api/exams/:id/topics
 * @desc   Add a topic to an exam
 * @access Protected
 */
router.post('/:id/topics', validate(createTopicSchema), ExamController.addTopic);

/**
 * @route  PATCH /api/exams/:id/topics/:topicId/toggle
 * @desc   Toggle topic completion (isDone)
 * @access Protected
 */
router.patch('/:id/topics/:topicId/toggle', ExamController.toggleTopic);

/**
 * @route  DELETE /api/exams/:id/topics/:topicId
 * @desc   Delete a topic
 * @access Protected
 */
router.delete('/:id/topics/:topicId', ExamController.deleteTopic);

export default router;
