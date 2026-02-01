import { Socket } from 'socket.io';
import logger from '../config/logger';

export interface WebSocketEvent {
  event: string;
  data: any;
  timestamp: Date;
}

export const handleChatMessage = async (socket: Socket, data: any) => {
  try {
    logger.debug('Chat message received:', data);
    // Handler logic is in chatGateway.ts
  } catch (error) {
    logger.error('Error handling chat message:', error);
    socket.emit('error', { message: 'Failed to process chat message' });
  }
};

export const handleTypingStatus = (socket: Socket, data: any) => {
  try {
    socket.broadcast.emit('user:typing', data);
  } catch (error) {
    logger.error('Error handling typing status:', error);
  }
};

export const handleNotification = (socket: Socket, data: any) => {
  try {
    logger.debug('Notification:', data);
    socket.emit('notification', data);
  } catch (error) {
    logger.error('Error handling notification:', error);
  }
};

export const handleProgressUpdate = (socket: Socket, data: any) => {
  try {
    socket.emit('progress:update', data);
  } catch (error) {
    logger.error('Error handling progress update:', error);
  }
};

export const handleRankingUpdate = (socket: Socket, data: any) => {
  try {
    socket.broadcast.emit('ranking:update', data);
  } catch (error) {
    logger.error('Error handling ranking update:', error);
  }
};
