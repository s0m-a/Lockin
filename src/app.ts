import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProduction } from './config/env';

import authRoutes   from './routes/auth.routes';
import eventRoutes  from './routes/event.routes';
import taskRoutes   from './routes/task.routes';
import noteRoutes   from './routes/note.routes';
import goalRoutes   from './routes/goal.routes';
import examRoutes   from './routes/exam.routes';
import habitRoutes  from './routes/habit.routes';

import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(helmet());

const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin && !isProduction) return callback(null, true);
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(morgan(isProduction ? 'combined' : 'dev'));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'lockin-api', version: '1.0.0' });
});

app.use('/api/auth',   authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tasks',  taskRoutes);
app.use('/api/notes',  noteRoutes);
app.use('/api/goals',  goalRoutes);
app.use('/api/exams',  examRoutes);
app.use('/api/habits', habitRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND',
  });
});

app.use(errorHandler);

export default app;
