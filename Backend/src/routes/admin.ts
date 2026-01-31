import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import {
  requireAuth,
  requireAdmin,
  validateId,
  validateCreateModule,
  validateCreateProduct,
  handleValidationErrors,
  apiLimiter,
} from '../middleware';
import { body, query } from 'express-validator';

const router = Router();

// All routes require admin authentication
router.use(requireAuth);
router.use(requireAdmin);

// Dashboard & Analytics
// GET /api/admin/dashboard
router.get('/dashboard', adminController.getDashboard);

// GET /api/admin/statistics
router.get(
  '/statistics',
  [query('period').optional().isIn(['week', 'month', 'year'])],
  handleValidationErrors,
  adminController.getStatistics
);

// GET /api/admin/analytics
router.get(
  '/analytics',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  handleValidationErrors,
  adminController.getAnalytics
);

// GET /api/admin/logs
router.get(
  '/logs',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('level').optional().isString(),
    query('action').optional().isString(),
  ],
  handleValidationErrors,
  adminController.getLogs
);

// User Management
// GET /api/admin/users
router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('role').optional().isString(),
    query('status').optional().isString(),
  ],
  handleValidationErrors,
  adminController.getAllUsers
);

// GET /api/admin/users/:id
router.get(
  '/users/:id',
  validateId,
  handleValidationErrors,
  adminController.getUserDetails
);

// POST /api/admin/users
router.post(
  '/users',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('username').notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  handleValidationErrors,
  adminController.createUser
);

// PUT /api/admin/users/:id
router.put(
  '/users/:id',
  validateId,
  handleValidationErrors,
  adminController.updateUser
);

// DELETE /api/admin/users/:id
router.delete(
  '/users/:id',
  validateId,
  handleValidationErrors,
  adminController.deleteUser
);

// POST /api/admin/users/:id/ban
router.post(
  '/users/:id/ban',
  validateId,
  [
    body('reason').notEmpty().withMessage('Ban reason is required'),
    body('duration').optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  adminController.banUser
);

// POST /api/admin/users/:id/unban
router.post(
  '/users/:id/unban',
  validateId,
  handleValidationErrors,
  adminController.unbanUser
);

// POST /api/admin/users/:id/suspend
router.post(
  '/users/:id/suspend',
  validateId,
  [body('reason').notEmpty().withMessage('Suspension reason is required')],
  handleValidationErrors,
  adminController.suspendUser
);

// POST /api/admin/users/:id/activate
router.post(
  '/users/:id/activate',
  validateId,
  handleValidationErrors,
  adminController.activateUser
);

// POST /api/admin/users/:id/role
router.post(
  '/users/:id/role',
  validateId,
  [
    body('role')
      .isIn(['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'])
      .withMessage('Valid role is required'),
  ],
  handleValidationErrors,
  adminController.assignRole
);

// GET /api/admin/users/:id/activity
router.get(
  '/users/:id/activity',
  validateId,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  adminController.getUserActivity
);

// GET /api/admin/users/:id/sessions
router.get(
  '/users/:id/sessions',
  validateId,
  handleValidationErrors,
  adminController.getUserSessions
);

// DELETE /api/admin/users/:id/sessions/:sessionId
router.delete(
  '/users/:id/sessions/:sessionId',
  adminController.revokeUserSession
);

// POST /api/admin/users/:id/reset-password
router.post(
  '/users/:id/reset-password',
  validateId,
  [
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  handleValidationErrors,
  adminController.resetUserPassword
);

// GET /api/admin/users/export
router.get(
  '/users/export',
  [query('format').optional().isIn(['json', 'csv'])],
  handleValidationErrors,
  adminController.exportUsers
);

// Shop Management
// GET /api/admin/shop/products
router.get(
  '/shop/products',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('category').optional().isString(),
  ],
  handleValidationErrors,
  adminController.getAllProducts
);

// POST /api/admin/shop/products
router.post(
  '/shop/products',
  validateCreateProduct,
  handleValidationErrors,
  adminController.createProduct
);

// PUT /api/admin/shop/products/:id
router.put(
  '/shop/products/:id',
  validateId,
  handleValidationErrors,
  adminController.updateProduct
);

// DELETE /api/admin/shop/products/:id
router.delete(
  '/shop/products/:id',
  validateId,
  handleValidationErrors,
  adminController.deleteProduct
);

// GET /api/admin/shop/orders
router.get(
  '/shop/orders',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isString(),
  ],
  handleValidationErrors,
  adminController.getAllOrders
);

// GET /api/admin/shop/orders/:id
router.get(
  '/shop/orders/:id',
  validateId,
  handleValidationErrors,
  adminController.getOrderDetails
);

// PUT /api/admin/shop/orders/:id/status
router.put(
  '/shop/orders/:id/status',
  validateId,
  [
    body('status')
      .isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
      .withMessage('Valid status is required'),
  ],
  handleValidationErrors,
  adminController.updateOrderStatus
);

// GET /api/admin/shop/stats/products
router.get('/shop/stats/products', adminController.getProductStats);

// GET /api/admin/shop/stats/orders
router.get('/shop/stats/orders', adminController.getOrderStats);

// Module Management
// GET /api/admin/modules
router.get(
  '/modules',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('category').optional().isString(),
  ],
  handleValidationErrors,
  adminController.getAllModules
);

// POST /api/admin/modules
router.post(
  '/modules',
  validateCreateModule,
  handleValidationErrors,
  adminController.createModule
);

// PUT /api/admin/modules/:id
router.put(
  '/modules/:id',
  validateId,
  handleValidationErrors,
  adminController.updateModule
);

// DELETE /api/admin/modules/:id
router.delete(
  '/modules/:id',
  validateId,
  handleValidationErrors,
  adminController.deleteModule
);

// GET /api/admin/modules/:id/enrollments
router.get(
  '/modules/:id/enrollments',
  validateId,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  adminController.getModuleEnrollments
);

// POST /api/admin/modules/:id/publish
router.post(
  '/modules/:id/publish',
  validateId,
  handleValidationErrors,
  adminController.publishModule
);

// POST /api/admin/modules/:id/unpublish
router.post(
  '/modules/:id/unpublish',
  validateId,
  handleValidationErrors,
  adminController.unpublishModule
);

// GET /api/admin/modules/stats
router.get('/modules/stats', adminController.getModuleStats);

// POST /api/admin/modules/categories
router.post(
  '/modules/categories',
  [
    body('name').notEmpty().withMessage('Category name is required'),
    body('slug').notEmpty().withMessage('Category slug is required'),
    body('description').optional().isString(),
  ],
  handleValidationErrors,
  adminController.createCategory
);

// PUT /api/admin/modules/categories/:id
router.put(
  '/modules/categories/:id',
  validateId,
  handleValidationErrors,
  adminController.updateCategory
);

// System Operations
// POST /api/admin/backup
router.post('/backup', adminController.backup);

// GET /api/admin/audit-logs
router.get(
  '/audit-logs',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('userId').optional().isString(),
    query('action').optional().isString(),
  ],
  handleValidationErrors,
  adminController.getAuditLogs
);

export default router;
