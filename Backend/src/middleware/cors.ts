import cors from 'cors';
import { env } from '../config/env';

export const corsConfig = cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
});
