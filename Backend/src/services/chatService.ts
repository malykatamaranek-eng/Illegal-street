import prisma from '../config/prisma';
import logger from '../config/logger';

export class ChatService {
  /**
   * Get chat messages
   */
  async getMessages(
    limit: number = 50,
    before?: string
  ) {
    try {
      const where: any = {
        deletedAt: null,
      };

      if (before) {
        where.createdAt = { lt: new Date(before) };
      }

      return await prisma.chatMessage.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }

  /**
   * Send message
   */
  async sendMessage(
    userId: string,
    messageText: string,
    encrypted: boolean = false
  ) {
    try {
      const message = await prisma.chatMessage.create({
        data: {
          userId,
          messageText,
          encrypted,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              level: true,
            },
          },
        },
      });

      return message;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Edit message
   */
  async editMessage(messageId: string, userId: string, newText: string) {
    try {
      // Verify ownership
      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new Error('Message not found');
      }

      if (message.userId !== userId) {
        throw new Error('Not authorized to edit this message');
      }

      return await prisma.chatMessage.update({
        where: { id: messageId },
        data: { messageText: newText },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              level: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error editing message:', error);
      throw error;
    }
  }

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string, isAdmin = false) {
    try {
      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new Error('Message not found');
      }

      // Only owner or admin can delete
      if (message.userId !== userId && !isAdmin) {
        throw new Error('Not authorized to delete this message');
      }

      await prisma.chatMessage.update({
        where: { id: messageId },
        data: { deletedAt: new Date() },
      });

      return true;
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Add reaction to message
   */
  async addReaction(messageId: string, userId: string, emoji: string) {
    try {
      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new Error('Message not found');
      }

      // Parse existing reactions
      let reactions: any = message.reactions || {};

      // Initialize emoji count if not exists
      if (!reactions[emoji]) {
        reactions[emoji] = { count: 0, users: [] };
      }

      // Check if user already reacted with this emoji
      if (reactions[emoji].users.includes(userId)) {
        // Remove reaction
        reactions[emoji].count--;
        reactions[emoji].users = reactions[emoji].users.filter(
          (id: string) => id !== userId
        );

        // Remove emoji if count is 0
        if (reactions[emoji].count === 0) {
          delete reactions[emoji];
        }
      } else {
        // Add reaction
        reactions[emoji].count++;
        reactions[emoji].users.push(userId);
      }

      return await prisma.chatMessage.update({
        where: { id: messageId },
        data: { reactions },
      });
    } catch (error) {
      logger.error('Error adding reaction:', error);
      throw new Error('Failed to add reaction');
    }
  }

  /**
   * Search messages
   */
  async searchMessages(query: string, limit: number = 20) {
    try {
      return await prisma.chatMessage.findMany({
        where: {
          messageText: {
            contains: query,
            mode: 'insensitive',
          },
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('Error searching messages:', error);
      throw new Error('Failed to search messages');
    }
  }

  /**
   * Get chat rooms
   */
  async getChatRooms() {
    try {
      return await prisma.chatRoom.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error fetching chat rooms:', error);
      throw new Error('Failed to fetch chat rooms');
    }
  }

  /**
   * Create chat room
   */
  async createChatRoom(name: string, type: string, participants?: string[]) {
    try {
      return await prisma.chatRoom.create({
        data: {
          name,
          type,
          participants: participants || [],
        },
      });
    } catch (error) {
      logger.error('Error creating chat room:', error);
      throw new Error('Failed to create chat room');
    }
  }

  /**
   * Get active users (for typing indicators, etc.)
   */
  async getActiveUsers(): Promise<string[]> {
    // This would typically use Redis or WebSocket state
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Record user typing status
   */
  async setUserTyping(userId: string, isTyping: boolean) {
    // This would typically use Redis with TTL
    // For now, just log it
    logger.debug(`User ${userId} typing: ${isTyping}`);
  }
}

export default new ChatService();
