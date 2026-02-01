import { Router } from 'express';
import * as shopController from '../controllers/shopController';
import {
  requireAuth,
  optionalAuth,
  validateId,
  handleValidationErrors,
  apiLimiter,
} from '../middleware';
import { body, query } from 'express-validator';

const router = Router();

// GET /api/shop/products
router.get(
  '/products',
  apiLimiter,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('sort').optional().isIn(['createdAt', 'price', 'popularity']),
  ],
  handleValidationErrors,
  shopController.getProducts
);

// GET /api/shop/products/:id
router.get(
  '/products/:id',
  validateId,
  handleValidationErrors,
  shopController.getProductById
);

// GET /api/shop/categories
router.get('/categories', apiLimiter, shopController.getCategories);

// GET /api/shop/categories/:categoryId/products
router.get(
  '/categories/:categoryId/products',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  shopController.getProductsByCategory
);

// GET /api/shop/search
router.get(
  '/search',
  apiLimiter,
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  shopController.searchProducts
);

// GET /api/shop/filter
router.get(
  '/filter',
  apiLimiter,
  [
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('category').optional().isString(),
    query('inStock').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  shopController.filterProducts
);

// POST /api/shop/cart (protected)
router.post(
  '/cart',
  requireAuth,
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').optional().isInt({ min: 1 }),
  ],
  handleValidationErrors,
  shopController.addToCart
);

// GET /api/shop/cart (protected)
router.get('/cart', requireAuth, shopController.getCart);

// PUT /api/shop/cart/:id (protected)
router.put(
  '/cart/:id',
  requireAuth,
  validateId,
  [
    body('quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
  ],
  handleValidationErrors,
  shopController.updateCartItem
);

// DELETE /api/shop/cart/:id (protected)
router.delete(
  '/cart/:id',
  requireAuth,
  validateId,
  handleValidationErrors,
  shopController.removeFromCart
);

// DELETE /api/shop/cart (protected)
router.delete('/cart', requireAuth, shopController.clearCart);

// POST /api/shop/checkout (protected)
router.post(
  '/checkout',
  requireAuth,
  [
    body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  ],
  handleValidationErrors,
  shopController.checkout
);

// GET /api/shop/orders (protected)
router.get(
  '/orders',
  requireAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  shopController.getOrders
);

// GET /api/shop/orders/:id (protected)
router.get(
  '/orders/:id',
  requireAuth,
  validateId,
  handleValidationErrors,
  shopController.getOrderById
);

// GET /api/shop/wishlist (protected)
router.get('/wishlist', requireAuth, shopController.getWishlist);

// POST /api/shop/wishlist (protected)
router.post(
  '/wishlist',
  requireAuth,
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
  ],
  handleValidationErrors,
  shopController.addToWishlist
);

// DELETE /api/shop/wishlist/:id (protected)
router.delete(
  '/wishlist/:id',
  requireAuth,
  validateId,
  handleValidationErrors,
  shopController.removeFromWishlist
);

// GET /api/shop/recommendations
router.get(
  '/recommendations',
  optionalAuth,
  [query('limit').optional().isInt({ min: 1, max: 50 })],
  handleValidationErrors,
  shopController.getRecommendations
);

export default router;
