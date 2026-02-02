import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';

const app: Express = express();

// Security
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));

// Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

export default app;
