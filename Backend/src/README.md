# Backend Source Structure

This directory contains the TypeScript source code for the Illegal Street backend.

## Directory Structure

```
src/
├── main.ts              # Express app configuration
├── server.ts            # HTTP + WebSocket server entry point
├── config/              # Configuration files (database, redis, etc.)
├── middleware/          # Express middleware (auth, validation, etc.)
├── controllers/         # Route controllers
├── routes/              # API route definitions
├── services/            # Business logic services
├── models/              # Data models and DTOs
├── utils/               # Utility functions and helpers
├── websocket/           # WebSocket handlers
├── jobs/                # Background job processors (Bull queues)
└── types/               # TypeScript type definitions
```

## Migration Status

The existing JavaScript files in the root Backend directory are being migrated to TypeScript.
Original files are kept for reference until migration is complete.

## Development

- Run `npm run dev` to start the development server with hot reload
- Run `npm run build` to compile TypeScript to JavaScript
- Run `npm test` to run the test suite
