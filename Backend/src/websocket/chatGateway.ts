import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from '../config/logger';
import { verifyToken } from '../middleware/auth';
import { chatService } from '../services';

interface AuthSocket extends Socket {
  userId?: string;
  username?: string;
}

interface DecodedToken {
  userId: string;
  id?: string;
  username: string;
  email?: string;
}

export class ChatGateway {
  private io: SocketServer;
  private connectedUsers: Map<string, AuthSocket>;

  constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.connectedUsers = new Map();
    this.initialize();
  }

  private initialize() {
    // Authentication middleware
    this.io.use(async (socket: AuthSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify token
        const decoded = verifyToken(token) as unknown as DecodedToken;
        socket.userId = decoded.userId || decoded.id || '';
        socket.username = decoded.username || decoded.email || '';

        logger.info(`User ${socket.username} authenticated via WebSocket`);
        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: AuthSocket) => {
      this.handleConnection(socket);
    });

    logger.info('Chat Gateway initialized');
  }

  private handleConnection(socket: AuthSocket) {
    const userId = socket.userId!;
    const username = socket.username!;

    logger.info(`User ${username} (${userId}) connected to chat`);

    // Store connected user
    this.connectedUsers.set(userId, socket);

    // Notify others that user is online
    this.io.emit('user:online', {
      userId,
      username,
      timestamp: new Date(),
    });

    // Send current online users to the new user
    const onlineUsers = Array.from(this.connectedUsers.keys());
    socket.emit('users:online', onlineUsers);

    // Handle chat events
    this.setupChatHandlers(socket);

    // Handle typing events
    this.setupTypingHandlers(socket);

    // Handle disconnect
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private setupChatHandlers(socket: AuthSocket) {
    const userId = socket.userId!;

    // Send message
    socket.on('chat:message', async (data: { message: string; encrypted?: boolean }) => {
      try {
        const message = await chatService.sendMessage(userId, data.message, data.encrypted);

        // Broadcast to all connected clients
        this.io.emit('chat:message', message);

        logger.info(`Message sent by user ${userId}`);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    // Edit message
    socket.on('chat:edit', async (data: { messageId: string; newText: string }) => {
      try {
        const message = await chatService.editMessage(data.messageId, userId, data.newText);

        // Broadcast edit to all clients
        this.io.emit('chat:edited', message);
      } catch (error) {
        logger.error('Error editing message:', error);
        socket.emit('chat:error', { message: 'Failed to edit message' });
      }
    });

    // Delete message
    socket.on('chat:delete', async (data: { messageId: string }) => {
      try {
        await chatService.deleteMessage(data.messageId, userId);

        // Broadcast deletion to all clients
        this.io.emit('chat:deleted', { messageId: data.messageId });
      } catch (error) {
        logger.error('Error deleting message:', error);
        socket.emit('chat:error', { message: 'Failed to delete message' });
      }
    });

    // Add reaction
    socket.on('chat:reaction', async (data: { messageId: string; emoji: string }) => {
      try {
        const message = await chatService.addReaction(data.messageId, userId, data.emoji);

        // Broadcast reaction to all clients
        this.io.emit('chat:reaction', {
          messageId: data.messageId,
          reactions: message.reactions,
        });
      } catch (error) {
        logger.error('Error adding reaction:', error);
        socket.emit('chat:error', { message: 'Failed to add reaction' });
      }
    });
  }

  private setupTypingHandlers(socket: AuthSocket) {
    const userId = socket.userId!;
    const username = socket.username!;

    socket.on('typing:start', () => {
      socket.broadcast.emit('user:typing', { userId, username, isTyping: true });
    });

    socket.on('typing:stop', () => {
      socket.broadcast.emit('user:typing', { userId, username, isTyping: false });
    });
  }

  private handleDisconnect(socket: AuthSocket) {
    const userId = socket.userId!;
    const username = socket.username!;

    logger.info(`User ${username} (${userId}) disconnected from chat`);

    // Remove from connected users
    this.connectedUsers.delete(userId);

    // Notify others that user is offline
    this.io.emit('user:offline', {
      userId,
      username,
      timestamp: new Date(),
    });
  }

  // Admin methods
  public broadcastNotification(notification: any) {
    this.io.emit('notification', notification);
  }

  public sendToUser(userId: string, event: string, data: any) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public getConnectionCount(): number {
    return this.connectedUsers.size;
  }
}

export default ChatGateway;
