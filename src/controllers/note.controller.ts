import { Request, Response, NextFunction } from 'express';
import * as NoteService from '../services/note.service';
import { noteQuerySchema } from '../validators/note.validator';
import { param } from '../utils/param.util';

// ─── GET /api/notes ───────────────────────────────────────────────────────────
export async function getNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filtersResult = noteQuerySchema.safeParse(req.query);
    const filters = filtersResult.success ? filtersResult.data : {};

    const notes = await NoteService.getNotes(req.user!.sub, filters);
    res.status(200).json({ success: true, data: { notes } });
  } catch (err) { next(err); }
}

// ─── POST /api/notes ──────────────────────────────────────────────────────────
export async function createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const note = await NoteService.createNote(req.user!.sub, req.body);
    res.status(201).json({ success: true, data: { note } });
  } catch (err) { next(err); }
}

// ─── PUT /api/notes/:id ───────────────────────────────────────────────────────
export async function updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const note = await NoteService.updateNote(param(req, 'id'), req.user!.sub, req.body);
    res.status(200).json({ success: true, data: { note } });
  } catch (err) { next(err); }
}

// ─── PATCH /api/notes/:id/pin ─────────────────────────────────────────────────
export async function pinNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const note = await NoteService.toggleNotePin(param(req, 'id'), req.user!.sub);
    res.status(200).json({ success: true, data: { note } });
  } catch (err) { next(err); }
}

// ─── DELETE /api/notes/:id ────────────────────────────────────────────────────
export async function deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await NoteService.deleteNote(param(req, 'id'), req.user!.sub);
    res.status(200).json({ success: true, message: 'Note deleted' });
  } catch (err) { next(err); }
}
