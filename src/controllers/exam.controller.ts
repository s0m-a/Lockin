import { Request, Response, NextFunction } from 'express';
import * as ExamService from '../services/exam.service';
import { examQuerySchema } from '../validators/exam.validator';
import { param } from '../utils/param.util';

// ─── GET /api/exams ───────────────────────────────────────────────────────────
export async function getExams(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filtersResult = examQuerySchema.safeParse(req.query);
    const filters = filtersResult.success ? filtersResult.data : {};

    const exams = await ExamService.getExams(req.user!.sub, filters);
    res.status(200).json({ success: true, data: { exams } });
  } catch (err) { next(err); }
}

// ─── GET /api/exams/:id ───────────────────────────────────────────────────────
export async function getExamById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const exam = await ExamService.getExamById(param(req, 'id'), req.user!.sub);
    res.status(200).json({ success: true, data: { exam } });
  } catch (err) { next(err); }
}

// ─── POST /api/exams ──────────────────────────────────────────────────────────
export async function createExam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const exam = await ExamService.createExam(req.user!.sub, req.body);
    res.status(201).json({ success: true, data: { exam } });
  } catch (err) { next(err); }
}

// ─── PUT /api/exams/:id ───────────────────────────────────────────────────────
export async function updateExam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const exam = await ExamService.updateExam(param(req, 'id'), req.user!.sub, req.body);
    res.status(200).json({ success: true, data: { exam } });
  } catch (err) { next(err); }
}

// ─── DELETE /api/exams/:id ────────────────────────────────────────────────────
export async function deleteExam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ExamService.deleteExam(param(req, 'id'), req.user!.sub);
    res.status(200).json({ success: true, message: 'Exam deleted' });
  } catch (err) { next(err); }
}

// ─── GET /api/exams/:id/topics ────────────────────────────────────────────────
export async function getTopics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const topics = await ExamService.getTopics(param(req, 'id'), req.user!.sub);
    res.status(200).json({ success: true, data: { topics } });
  } catch (err) { next(err); }
}

// ─── POST /api/exams/:id/topics ───────────────────────────────────────────────
export async function addTopic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const topic = await ExamService.addTopic(param(req, 'id'), req.user!.sub, req.body);
    res.status(201).json({ success: true, data: { topic } });
  } catch (err) { next(err); }
}

// ─── PATCH /api/exams/:id/topics/:topicId/toggle ──────────────────────────────
export async function toggleTopic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const topic = await ExamService.toggleTopic(
      param(req, 'id'),
      param(req, 'topicId'),
      req.user!.sub
    );
    res.status(200).json({ success: true, data: { topic } });
  } catch (err) { next(err); }
}

// ─── DELETE /api/exams/:id/topics/:topicId ────────────────────────────────────
export async function deleteTopic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ExamService.deleteTopic(
      param(req, 'id'),
      param(req, 'topicId'),
      req.user!.sub
    );
    res.status(200).json({ success: true, message: 'Topic deleted' });
  } catch (err) { next(err); }
}
