# Backend TypeScript Migration Guide

## Quick Start

### Development
```bash
cd Backend
npm run dev
```
Server will run on http://localhost:5000

### Production Build
```bash
npm run build
npm start
```

### Docker (Full Stack)
```bash
npm run docker:up
```
Starts PostgreSQL, Redis, and Backend

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development with nodemon + ts-node |
| `npm run dev:tsx` | Development with tsx (faster) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm test` | Run tests with coverage |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Lint code |
| `npm run format` | Format code with Prettier |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |

## Environment Setup

1. Copy environment variables:
```bash
cp .env.example .env
```

2. Update the following in `.env`:
   - `DATABASE_URL` - PostgreSQL connection
   - `REDIS_URL` - Redis connection
   - `JWT_SECRET` - JWT signing secret (min 32 chars)
   - `JWT_REFRESH_SECRET` - Refresh token secret
   - AWS S3 credentials (if using file uploads)
   - SMTP settings (if using emails)
   - Sentry DSN (if using error tracking)

## Database Setup

### With Docker
```bash
npm run docker:up
npm run migrate
```

### Manual PostgreSQL
```bash
# Create database
createdb illegal_street

# Run migrations
npm run migrate

# Open Prisma Studio
npm run prisma:studio
```

## Project Structure

```
Backend/
├── src/                    # TypeScript source code
│   ├── main.ts            # Express app configuration
│   ├── server.ts          # Server entry point
│   ├── config/            # Configuration files
│   ├── middleware/        # Express middleware
│   ├── controllers/       # Route controllers
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── models/            # Data models
│   ├── utils/             # Utility functions
│   ├── websocket/         # WebSocket handlers
│   ├── jobs/              # Background jobs (Bull)
│   ├── types/             # TypeScript types
│   └── tests/             # Test files
├── dist/                  # Compiled JavaScript (generated)
├── prisma/                # Prisma schema and migrations
│   └── schema.prisma      # Database schema
├── node_modules/          # Dependencies
├── logs/                  # Application logs
├── uploads/               # File uploads
├── tsconfig.json          # TypeScript configuration
├── jest.config.js         # Jest configuration
├── nodemon.json           # Nodemon configuration
├── .eslintrc.js          # ESLint configuration
├── .prettierrc.js        # Prettier configuration
├── Dockerfile            # Docker image
├── docker-compose.yml    # Docker Compose
└── package.json          # Dependencies and scripts
```

## Migration from JavaScript

The original JavaScript files are preserved in the root directory:
- `server.js` → Migrated to `src/server.ts`
- `config/` → Migrate to `src/config/`
- `controllers/` → Migrate to `src/controllers/`
- `middleware/` → Migrate to `src/middleware/`
- `routes/` → Migrate to `src/routes/`

### Migration Steps for Each Module

1. Create TypeScript file in `src/` directory
2. Add proper type definitions
3. Import types from `src/types/`
4. Use Prisma instead of raw SQL
5. Add error handling with proper types
6. Write tests in `*.test.ts` files
7. Verify with `npm run typecheck`

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# With coverage
npm run test:ci
```

### Writing Tests

Create test files next to source files:
```typescript
// src/services/auth.service.test.ts
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('should hash password', async () => {
    const hashed = await AuthService.hashPassword('password123');
    expect(hashed).toBeDefined();
  });
});
```

## Code Quality

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run typecheck
```

## Dependencies

### Production
- **@prisma/client**: PostgreSQL ORM
- **express**: Web framework
- **ioredis**: Redis client
- **socket.io**: WebSocket
- **bull**: Job queue
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT auth
- **winston**: Logging
- **@sentry/node**: Error tracking
- **aws-sdk**: S3 storage
- **nodemailer**: Email
- **helmet, cors, express-rate-limit**: Security

### Development
- **typescript**: Language
- **ts-node**: Run TypeScript
- **tsx**: Fast TypeScript runner
- **jest**: Testing
- **eslint, prettier**: Code quality
- **prisma**: Database toolkit

## Troubleshooting

### TypeScript Errors
```bash
npm run typecheck
```
Fix any type errors before building.

### Database Connection Issues
1. Check `DATABASE_URL` in `.env`
2. Ensure PostgreSQL is running
3. Test connection: `npm run prisma:studio`

### Redis Connection Issues
1. Check `REDIS_URL` in `.env`
2. Ensure Redis is running
3. Test with: `docker ps` (if using Docker)

### Build Failures
```bash
npm run clean
npm run build
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=5001
```

## Security Checklist

Before deploying:
- [ ] Change all secrets in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (`COOKIE_SECURE=true`)
- [ ] Configure CORS origins
- [ ] Enable Sentry error tracking
- [ ] Set up rate limiting
- [ ] Configure JWT rotation
- [ ] Enable database SSL
- [ ] Set up Redis password
- [ ] Configure AWS S3 access
- [ ] Set up email SMTP
- [ ] Enable security headers
- [ ] Configure CSP

## Deployment

### Docker Production
```bash
npm run docker:build
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
```bash
npm run build
npm run migrate:deploy
NODE_ENV=production npm start
```

## Support

- See `TYPESCRIPT_SETUP_SUMMARY.md` for detailed setup information
- Check `README.md` for security features
- Review `.env.example` for all configuration options
