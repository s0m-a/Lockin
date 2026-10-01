import { Request, Response, NextFunction } from 'express';
import * as EventService from '../services/event.service';
import { param } from '../utils/param.util';

// ─── GET /api/events ──────────────────────────────────────────────────────────
export async function getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const events = await EventService.getEvents(req.user!.sub);
    res.status(200).json({ success: true, data: { events } });
  } catch (err) { next(err); }
}

// ─── POST /api/events ─────────────────────────────────────────────────────────
export async function createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await EventService.createEvent(req.user!.sub, req.body);
    res.status(201).json({ success: true, data: { event } });
  } catch (err) { next(err); }
}

// ─── PUT /api/events/:id ──────────────────────────────────────────────────────
export async function updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await EventService.updateEvent(param(req, 'id'), req.user!.sub, req.body);
    res.status(200).json({ success: true, data: { event } });
  } catch (err) { next(err); }
}

// ─── DELETE /api/events/:id ───────────────────────────────────────────────────
export async function deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await EventService.deleteEvent(param(req, 'id'), req.user!.sub);
    res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (err) { next(err); }
}
