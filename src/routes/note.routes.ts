import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.middleware';
import { validate } from '../middleware/validate.middleware';
import { createNoteSchema, updateNoteSchema } from '../validators/note.validator';
import * as NoteController from '../controllers/note.controller';

const router = Router();

router.use(authenticate);

/**
 * @route  GET /api/notes
 * @desc   Get all notes. Supports ?category, ?isPinned, ?search (full-text)
 * @access Protected
 */
router.get('/', NoteController.getNotes);

/**
 * @route  POST /api/notes
 * @desc   Create a new note
 * @access Protected
 */
router.post('/', validate(createNoteSchema), NoteController.createNote);

/**
 * @route  PUT /api/notes/:id
 * @desc   Full update of a note
 * @access Protected
 */
router.put('/:id', validate(updateNoteSchema), NoteController.updateNote);

/**
 * @route  PATCH /api/notes/:id/pin
 * @desc   Toggle pinned status on a note
 * @access Protected
 */
router.patch('/:id/pin', NoteController.pinNote);

/**
 * @route  DELETE /api/notes/:id
 * @desc   Delete a note
 * @access Protected
 */
router.delete('/:id', NoteController.deleteNote);

export default router;
