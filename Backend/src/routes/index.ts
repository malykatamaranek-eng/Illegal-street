import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import moduleRoutes from './modules';
import quizRoutes from './quizzes';
import progressRoutes from './progress';
import rankingRoutes from './ranking';
import shopRoutes from './shop';
import chatRoutes from './chat';
import adminRoutes from './admin';
import cookieConsentRoutes from './cookieConsent';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/modules', moduleRoutes);
router.use('/quizzes', quizRoutes);
router.use('/progress', progressRoutes);
router.use('/ranking', rankingRoutes);
router.use('/shop', shopRoutes);
router.use('/chat', chatRoutes);
router.use('/admin', adminRoutes);
router.use('/cookie-consent', cookieConsentRoutes);

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
      quizzes: '/api/quizzes',
      progress: '/api/progress',
      ranking: '/api/ranking',
      shop: '/api/shop',
      chat: '/api/chat',
      admin: '/api/admin',
      cookieConsent: '/api/cookie-consent',
    },
  });
});

export default router;
