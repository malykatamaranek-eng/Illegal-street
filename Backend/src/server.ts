import 'dotenv/config';
import http from 'http';
import app from './main';
import ChatGateway from './websocket/chatGateway';
import logger from './config/logger';

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0'; // Configurable host binding
const server = http.createServer(app);

// Initialize WebSocket
export let chatGateway: ChatGateway;

const startServer = async (): Promise<void> => {
  try {
    // Initialize Chat Gateway
    chatGateway = new ChatGateway(server);
    logger.info('Chat Gateway initialized successfully');

    server.listen(PORT, HOST, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info('WebSocket enabled');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();
