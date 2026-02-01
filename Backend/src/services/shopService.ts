import prisma from '../config/prisma';
import logger from '../config/logger';
import { OrderStatus } from '@prisma/client';

export class ShopService {
  /**
   * Get all products with filters
   */
  async getProducts(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        category,
        minPrice,
        maxPrice,
        search,
        page = 1,
        limit = 20,
      } = filters;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (category) {
        where.category = { name: category };
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where }),
      ]);

      return {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { category: true },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    } catch (error) {
      logger.error('Error fetching product:', error);
      throw new Error('Failed to fetch product');
    }
  }

  /**
   * Add item to cart
   */
  async addToCart(userId: string, productId: string, quantity: number = 1) {
    try {
      // Check if product exists and has stock
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (product.stock < quantity) {
        throw new Error('Insufficient stock');
      }

      // Check if item already in cart
      const existing = await prisma.cartItem.findUnique({
        where: {
          userId_productId: { userId, productId },
        },
      });

      if (existing) {
        // Update quantity
        return await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
          include: { product: true },
        });
      }

      // Add new item
      return await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
        },
        include: { product: true },
      });
    } catch (error) {
      logger.error('Error adding to cart:', error);
      throw error;
    }
  }

  /**
   * Get user cart
   */
  async getCart(userId: string) {
    try {
      const items = await prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: {
            include: { category: true },
          },
        },
      });

      const total = items.reduce(
        (sum, item) =>
          sum + Number(item.product.price) * item.quantity,
        0
      );

      return {
        items,
        total,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      };
    } catch (error) {
      logger.error('Error fetching cart:', error);
      throw new Error('Failed to fetch cart');
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(cartItemId: string, quantity: number) {
    try {
      if (quantity <= 0) {
        // Remove item
        await prisma.cartItem.delete({ where: { id: cartItemId } });
        return null;
      }

      return await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
        include: { product: true },
      });
    } catch (error) {
      logger.error('Error updating cart item:', error);
      throw new Error('Failed to update cart item');
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(cartItemId: string) {
    try {
      await prisma.cartItem.delete({ where: { id: cartItemId } });
      return true;
    } catch (error) {
      logger.error('Error removing from cart:', error);
      throw new Error('Failed to remove from cart');
    }
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string) {
    try {
      await prisma.cartItem.deleteMany({ where: { userId } });
      return true;
    } catch (error) {
      logger.error('Error clearing cart:', error);
      throw new Error('Failed to clear cart');
    }
  }

  /**
   * Create order from cart
   */
  async checkout(userId: string) {
    try {
      // Get cart items
      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Check stock availability
      for (const item of cartItems) {
        if (item.product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.product.name}`);
        }
      }

      // Calculate total
      const total = cartItems.reduce(
        (sum, item) =>
          sum + Number(item.product.price) * item.quantity,
        0
      );

      // Create order
      const order = await prisma.order.create({
        data: {
          userId,
          items: cartItems.map((item) => ({
            productId: item.productId,
            name: item.product.name,
            price: Number(item.product.price),
            quantity: item.quantity,
          })),
          totalPrice: total,
          status: OrderStatus.PENDING,
        },
      });

      // Update product stock
      for (const item of cartItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      // Clear cart
      await this.clearCart(userId);

      return order;
    } catch (error) {
      logger.error('Error during checkout:', error);
      throw error;
    }
  }

  /**
   * Get user orders
   */
  async getUserOrders(userId: string) {
    try {
      return await prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string, userId: string) {
    try {
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      logger.error('Error fetching order:', error);
      throw new Error('Failed to fetch order');
    }
  }

  /**
   * Add to wishlist
   */
  async addToWishlist(userId: string, productId: string) {
    try {
      const existing = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: { userId, productId },
        },
      });

      if (existing) {
        return existing;
      }

      return await prisma.wishlistItem.create({
        data: { userId, productId },
        include: { product: true },
      });
    } catch (error) {
      logger.error('Error adding to wishlist:', error);
      throw new Error('Failed to add to wishlist');
    }
  }

  /**
   * Get user wishlist
   */
  async getWishlist(userId: string) {
    try {
      return await prisma.wishlistItem.findMany({
        where: { userId },
        include: {
          product: {
            include: { category: true },
          },
        },
        orderBy: { addedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error fetching wishlist:', error);
      throw new Error('Failed to fetch wishlist');
    }
  }

  /**
   * Remove from wishlist
   */
  async removeFromWishlist(userId: string, productId: string) {
    try {
      await prisma.wishlistItem.delete({
        where: {
          userId_productId: { userId, productId },
        },
      });
      return true;
    } catch (error) {
      logger.error('Error removing from wishlist:', error);
      throw new Error('Failed to remove from wishlist');
    }
  }

  /**
   * Get product categories
   */
  async getCategories() {
    try {
      return await prisma.productCategory.findMany({
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }
}

export default new ShopService();
