import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import moduleRoutes from './modules';
import progressRoutes from './progress';
import rankingRoutes from './ranking';
import shopRoutes from './shop';
import chatRoutes from './chat';
import adminRoutes from './admin';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/modules', moduleRoutes);
router.use('/progress', progressRoutes);
router.use('/ranking', rankingRoutes);
router.use('/shop', shopRoutes);
router.use('/chat', chatRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API info
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Illegal-street API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      modules: '/api/modules',
      progress: '/api/progress',
      ranking: '/api/ranking',
      shop: '/api/shop',
      chat: '/api/chat',
      admin: '/api/admin',
    },
  });
});

export default router;
