import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import prisma from '../config/prisma';
import logger from '../config/logger';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search, sort = 'createdAt' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  
  const orderBy: any = {};
  if (sort === 'price') {
    orderBy.price = 'asc';
  } else if (sort === 'popularity') {
    orderBy.sales = 'desc';
  } else {
    orderBy.createdAt = 'desc';
  }
  
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy,
      include: {
        category: true,
      },
    }),
    prisma.product.count({ where }),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }
  
  res.status(200).json({
    success: true,
    data: product,
  });
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.productCategory.findMany({
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });
  
  res.status(200).json({
    success: true,
    data: categories,
  });
});

export const getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.params as { categoryId: string };
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const products = await prisma.product.findMany({
    where: {
      categoryId,
    },
    skip,
    take: parseInt(limit as string),
    include: {
      category: true,
    },
  });
  
  res.status(200).json({
    success: true,
    data: products,
  });
});

export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const { q, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
      ],
    },
    skip,
    take: parseInt(limit as string),
    include: {
      category: true,
    },
  });
  
  res.status(200).json({
    success: true,
    data: products,
  });
});

export const filterProducts = asyncHandler(async (req: Request, res: Response) => {
  const { minPrice, maxPrice, category, inStock, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {};
  
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice as string);
    if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
  }
  
  if (category) {
    where.categoryId = category;
  }
  
  if (inStock === 'true') {
    where.stock = { gt: 0 };
  }
  
  const products = await prisma.product.findMany({
    where,
    skip,
    take: parseInt(limit as string),
    include: {
      category: true,
    },
  });
  
  res.status(200).json({
    success: true,
    data: products,
  });
});

export const addToCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { productId, quantity = 1 } = req.body;
  
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  
  if (!product) {
    res.status(404).json({
      success: false,
      message: 'Product not found',
    });
    return;
  }
  
  // Check if item already in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      userId,
      productId,
    },
  });
  
  if (existingItem) {
    const updatedItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
      },
      include: {
        product: true,
      },
    });
    
    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: updatedItem,
    });
    return;
  }
  
  const cartItem = await prisma.cartItem.create({
    data: {
      userId,
      productId,
      quantity,
    },
    include: {
      product: true,
    },
  });
  
  logger.info(`User ${userId} added product ${productId} to cart`);
  
  res.status(201).json({
    success: true,
    message: 'Added to cart',
    data: cartItem,
  });
});

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  });
  
  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  
  res.status(200).json({
    success: true,
    data: {
      items: cartItems,
      total,
      itemCount: cartItems.length,
    },
  });
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  const { quantity } = req.body;
  
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id,
      userId,
    },
  });
  
  if (!cartItem) {
    return res.status(404).json({
      success: false,
      message: 'Cart item not found',
    });
  }
  
  const updatedItem = await prisma.cartItem.update({
    where: { id },
    data: { quantity },
    include: {
      product: true,
    },
  });
  
  res.status(200).json({
    success: true,
    message: 'Cart item updated',
    data: updatedItem,
  });
});

export const removeFromCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id,
      userId,
    },
  });
  
  if (!cartItem) {
    return res.status(404).json({
      success: false,
      message: 'Cart item not found',
    });
  }
  
  await prisma.cartItem.delete({
    where: { id },
  });
  
  logger.info(`User ${userId} removed item ${id} from cart`);
  
  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
  });
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  await prisma.cartItem.deleteMany({
    where: { userId },
  });
  
  logger.info(`User ${userId} cleared cart`);
  
  res.status(200).json({
    success: true,
    message: 'Cart cleared',
  });
});

export const checkout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { paymentMethod } = req.body;
  
  // Get cart items
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: true,
    },
  });
  
  if (cartItems.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Cart is empty',
    });
    return;
  }
  
  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );
  
  // Create order
  const order = await prisma.order.create({
    data: {
      userId,
      totalPrice: total,
      status: 'PENDING',
      items: JSON.stringify(cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.product.price),
      }))),
    },
  });
  
  // Clear cart
  await prisma.cartItem.deleteMany({
    where: { userId },
  });
  
  logger.info(`User ${userId} created order ${order.id}`);
  
  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order,
  });
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const orders = await prisma.order.findMany({
    where: { userId },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: orders,
  });
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  
  const order = await prisma.order.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }
  
  res.status(200).json({
    success: true,
    data: order,
  });
});

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const wishlist = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  });
  
  res.status(200).json({
    success: true,
    data: wishlist,
  });
});

export const addToWishlist = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { productId } = req.body;
  
  // Check if already in wishlist
  const existing = await prisma.wishlistItem.findFirst({
    where: {
      userId,
      productId,
    },
  });
  
  if (existing) {
    res.status(400).json({
      success: false,
      message: 'Product already in wishlist',
    });
    return;
  }
  
  const wishlistItem = await prisma.wishlistItem.create({
    data: {
      userId,
      productId,
    },
    include: {
      product: true,
    },
  });
  
  logger.info(`User ${userId} added product ${productId} to wishlist`);
  
  res.status(201).json({
    success: true,
    message: 'Added to wishlist',
    data: wishlistItem,
  });
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  
  const wishlistItem = await prisma.wishlistItem.findFirst({
    where: {
      id,
      userId,
    },
  });
  
  if (!wishlistItem) {
    return res.status(404).json({
      success: false,
      message: 'Wishlist item not found',
    });
  }
  
  await prisma.wishlistItem.delete({
    where: { id },
  });
  
  logger.info(`User ${userId} removed item ${id} from wishlist`);
  
  res.status(200).json({
    success: true,
    message: 'Removed from wishlist',
  });
});

export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const { limit = '10' } = req.query;
  
  // Simple recommendation: get popular products
  const products = await prisma.product.findMany({
    take: parseInt(limit as string),
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      category: true,
    },
  });
  
  res.status(200).json({
    success: true,
    data: products,
  });
});
