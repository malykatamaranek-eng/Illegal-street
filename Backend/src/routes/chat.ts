import { Router } from 'express';
import * as chatController from '../controllers/chatController';
import {
  requireAuth,
  requireAdmin,
  validateId,
  handleValidationErrors,
  uploadSingle,
  apiLimiter,
} from '../middleware';
import { body, query } from 'express-validator';

const router = Router();

// GET /api/chat/messages (protected)
router.get(
  '/messages',
  requireAuth,
  apiLimiter,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('before').optional().isISO8601(),
    query('after').optional().isISO8601(),
  ],
  handleValidationErrors,
  chatController.getMessages
);

// POST /api/chat/messages (protected)
router.post(
  '/messages',
  requireAuth,
  [
    body('content').notEmpty().withMessage('Message content is required'),
    body('replyToId').optional().isString(),
  ],
  handleValidationErrors,
  chatController.sendMessage
);

// GET /api/chat/messages/:id (protected)
router.get(
  '/messages/:id',
  requireAuth,
  validateId,
  handleValidationErrors,
  chatController.getMessageById
);

// PUT /api/chat/messages/:id (protected)
router.put(
  '/messages/:id',
  requireAuth,
  validateId,
  [
    body('content').notEmpty().withMessage('Message content is required'),
  ],
  handleValidationErrors,
  chatController.updateMessage
);

// DELETE /api/chat/messages/:id (protected, admin can delete any)
router.delete(
  '/messages/:id',
  requireAuth,
  validateId,
  handleValidationErrors,
  chatController.deleteMessage
);

// GET /api/chat/users (protected)
router.get(
  '/users',
  requireAuth,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('online').optional().isBoolean(),
  ],
  handleValidationErrors,
  chatController.getChatUsers
);

// GET /api/chat/notifications (protected)
router.get(
  '/notifications',
  requireAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('unread').optional().isBoolean(),
  ],
  handleValidationErrors,
  chatController.getNotifications
);

// POST /api/chat/upload (protected)
router.post(
  '/upload',
  requireAuth,
  uploadSingle('file'),
  chatController.uploadFile
);

// GET /api/chat/typing (protected)
router.get('/typing', requireAuth, chatController.getTypingStatus);

// POST /api/chat/messages/:messageId/reactions (protected)
router.post(
  '/messages/:messageId/reactions',
  requireAuth,
  [
    body('emoji').notEmpty().withMessage('Emoji is required'),
  ],
  handleValidationErrors,
  chatController.addReaction
);

// GET /api/chat/mentions (protected)
router.get(
  '/mentions',
  requireAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  chatController.getMentions
);

// GET /api/chat/stats (protected)
router.get('/stats', requireAuth, chatController.getChatStats);

export default router;
