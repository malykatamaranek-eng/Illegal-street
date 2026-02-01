import 'dotenv/config';
import http from 'http';
import app from './main';
import ChatGateway from './websocket/chatGateway';
import logger from './config/logger';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize WebSocket
export let chatGateway: ChatGateway;

const startServer = async (): Promise<void> => {
  try {
    // Initialize Chat Gateway
    chatGateway = new ChatGateway(server);
    logger.info('Chat Gateway initialized successfully');

    server.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      console.log(`✓ WebSocket enabled`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();
