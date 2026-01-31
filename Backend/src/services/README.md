# Service Layer Documentation

This directory contains the core service layer for the Illegal Street backend. All business logic is centralized here, making the codebase maintainable and testable.

## Services Overview

### 1. **authService.ts** - Authentication Service
Complete authentication service with JWT token management.

**Methods:**
- `register(email, username, password)` - User registration with bcrypt hashing
- `login(email, password)` - Login with JWT generation
- `generateTokens(userId)` - Generate JWT access + refresh tokens
- `verifyToken(token)` - Verify JWT token
- `refreshAccessToken(refreshToken)` - Refresh token rotation
- `logout(userId, sessionId?)` - Logout and invalidate session
- `forgotPassword(email)` - Generate password reset token
- `resetPassword(token, newPassword)` - Reset password with token
- `verifyEmail(token)` - Email verification
- `setup2FA(userId)` - Setup 2FA
- `verify2FA(userId, code)` - Verify 2FA code

**Features:**
- Bcrypt password hashing (12 rounds)
- JWT access tokens (15 minutes)
- JWT refresh tokens (7 days)
- Session management in database
- Token rotation for security
- Password reset via email
- 2FA support

### 2. **userService.ts** - User Management Service
Comprehensive user profile and social features.

**Methods:**
- `getUserProfile(userId)` - Get user profile
- `updateProfile(userId, data)` - Update profile information
- `updateAvatar(userId, avatarUrl)` - Update user avatar
- `changePassword(userId, oldPassword, newPassword)` - Change password
- `getUserStats(userId)` - Get user statistics (level, points, streak, etc.)
- `followUser(followerId, followingId)` - Follow another user
- `unfollowUser(followerId, followingId)` - Unfollow a user
- `getFollowers(userId, limit?, offset?)` - Get user's followers
- `getFollowing(userId, limit?, offset?)` - Get users being followed
- `searchUsers(query, filters?)` - Search users with filters
- `deleteAccount(userId)` - Delete user account

**Features:**
- Profile management
- Social following system
- User search with filters
- Statistics aggregation
- Account deletion

### 3. **encryptionService.ts** - End-to-End Encryption
E2E encryption using libsodium for secure messaging.

**Methods:**
- `generateKeyPair()` - Generate public/private key pair
- `encryptMessage(message, recipientPublicKey, senderPrivateKey)` - Encrypt message
- `decryptMessage(encryptedMessage, recipientPrivateKey, senderPublicKey)` - Decrypt message
- `hash(data)` - Hash data using sodium's generic hash
- `generateRandomToken(length?)` - Generate random secure token

**Features:**
- Asymmetric encryption with libsodium
- Key pair generation
- Secure message encryption/decryption
- Cryptographic hashing

### 4. **emailService.ts** - Email Service
Email sending with Bull queue for async processing.

**Methods:**
- `sendEmail(to, subject, html, text?)` - Send email via SMTP
- `sendVerificationEmail(user, token)` - Send email verification
- `sendPasswordResetEmail(user, token)` - Send password reset email
- `sendWelcomeEmail(user)` - Send welcome email

**Features:**
- SMTP integration with nodemailer
- Bull queue for async email processing
- Retry mechanism with exponential backoff
- HTML email templates
- Mock mode for development
- Professional email templates

### 5. **notificationService.ts** - Notification Service
Real-time notification management.

**Methods:**
- `createNotification(userId, message, type?, metadata?)` - Create notification
- `getNotifications(userId, filters?)` - Get user notifications
- `getUnreadCount(userId)` - Get unread notification count
- `markAsRead(notificationId)` - Mark notification as read
- `markAllAsRead(userId)` - Mark all notifications as read
- `deleteNotification(notificationId)` - Delete notification
- `deleteAllNotifications(userId)` - Delete all user notifications
- `deleteReadNotifications(userId)` - Delete read notifications
- `broadcastNotification(userIds, message, metadata?)` - Send to multiple users

**Helper Methods:**
- `notifyAchievement(userId, achievementName)` - Achievement notification
- `notifyFollow(userId, followerUsername)` - Follow notification
- `notifyModuleCompletion(userId, moduleName, pointsEarned)` - Module completion
- `notifyOrder(userId, orderId, status)` - Order status notification

**Features:**
- Database storage with Prisma
- Filtering and pagination
- Batch operations
- WebSocket ready (placeholder)
- Helper methods for common notifications

### 6. **imageService.ts** - Image Upload & Processing
Image upload with S3 and local storage support.

**Methods:**
- `uploadImage(file, folder?)` - Upload image to S3 or local
- `deleteImage(imageUrl)` - Delete image
- `resizeImage(buffer, width, height)` - Resize image (placeholder)
- `getImageUrl(key)` - Get image URL
- `uploadMultiple(files, folder?)` - Upload multiple images
- `getUploadStats()` - Get upload statistics

**Features:**
- AWS S3 integration
- Local storage fallback
- File validation (type, size)
- Automatic file naming with hash
- Support for multiple file uploads
- Upload statistics
- Mock mode for development

### 7. **analyticsService.ts** - Analytics & Metrics
Comprehensive analytics and statistics.

**Methods:**
- `trackUserActivity(userId, action, metadata?)` - Track user activity
- `getUserStats(userId)` - Get user statistics
- `getGlobalStats()` - Get global platform statistics
- `getModuleStats(moduleId)` - Get module statistics
- `getDashboardStats()` - Get dashboard statistics
- `getUserActivityStats(userId)` - Get user activity from Redis
- `getLeaderboard(limit?)` - Get user leaderboard
- `clearCache(resource, id?)` - Clear cached statistics

**Features:**
- Redis-based activity tracking
- Prisma aggregations
- Caching for performance
- Real-time leaderboard
- Dashboard metrics
- Module completion rates
- Revenue tracking
- Event statistics

## Common Patterns

All services follow these patterns:

1. **Singleton Pattern**: Each service is exported as a singleton instance
2. **Error Handling**: Custom error classes for different scenarios
3. **Logging**: Winston logger for all operations
4. **Async/Await**: Modern async patterns throughout
5. **TypeScript**: Fully typed with interfaces
6. **Prisma**: Database operations via Prisma Client
7. **Validation**: Input validation before processing
8. **Caching**: Redis caching where appropriate
9. **Transactions**: Database transactions for complex operations

## Usage Example

```typescript
import { authService, userService, notificationService } from './services';

// Register a new user
const result = await authService.register({
  email: 'user@example.com',
  username: 'johndoe',
  password: 'securePassword123',
});

// Get user profile
const profile = await userService.getUserProfile(result.user.id);

// Create notification
await notificationService.createNotification({
  user_id: result.user.id,
  message: 'Welcome to Illegal Street!',
  type: 'SYSTEM',
});
```

## Configuration

Services are configured via environment variables. See `.env.example` for all configuration options.

### Key Environment Variables:

```env
# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Bcrypt
BCRYPT_ROUNDS=12

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket

# Features
EMAIL_QUEUE_ENABLED=true
DEV_MOCK_EMAIL=true
DEV_MOCK_S3=true
```

## Testing

Each service can be tested independently:

```typescript
import authService from './services/authService';

describe('AuthService', () => {
  it('should register a new user', async () => {
    const result = await authService.register({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    });
    expect(result.user).toBeDefined();
    expect(result.tokens).toBeDefined();
  });
});
```

## Dependencies

- **@prisma/client** - Database ORM
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT tokens
- **nodemailer** - Email sending
- **bull** - Job queue
- **ioredis** - Redis client
- **aws-sdk** - S3 uploads
- **libsodium-wrappers** - Encryption
- **winston** - Logging

## Notes

1. **2FA Implementation**: Currently uses a placeholder. In production, integrate `speakeasy` for proper TOTP implementation.

2. **Image Resizing**: Placeholder implementation. Install `sharp` for production image processing.

3. **WebSocket Events**: Notification service has placeholders for WebSocket. Integrate with Socket.io when WebSocket service is ready.

4. **Email Templates**: Basic HTML templates included. Consider using a template engine like Handlebars for more complex templates.

5. **Cache Strategy**: Analytics service uses Redis caching with TTL. Adjust cache durations based on your needs.

6. **Rate Limiting**: Consider adding rate limiting to prevent abuse, especially for email and notification services.

7. **Monitoring**: Integrate with Sentry or similar service for error tracking and monitoring.

8. **Security**: 
   - All passwords are hashed with bcrypt
   - JWT tokens use secure secrets
   - Input validation throughout
   - SQL injection prevention via Prisma
   - File upload validation

## Future Enhancements

- [ ] Add service-level rate limiting
- [ ] Implement proper 2FA with speakeasy
- [ ] Add image resizing with sharp
- [ ] WebSocket integration for real-time notifications
- [ ] More comprehensive analytics
- [ ] Batch operations for better performance
- [ ] Service health checks
- [ ] Metrics export (Prometheus)
- [ ] Advanced caching strategies
- [ ] Database query optimization

## Maintainers

For questions or issues, contact the backend team.
