# Illegal Street - API Documentation

Complete API documentation for all 130+ endpoints.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { ... },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

### POST /api/auth/logout
Logout current session (requires authentication).

### POST /api/auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/reset-password
Reset password with token from email.

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "NewSecurePassword123!"
}
```

### POST /api/auth/verify-email
Verify email address with token.

**Request Body:**
```json
{
  "token": "verification_token"
}
```

### POST /api/auth/2fa/setup
Setup two-factor authentication (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "secret": "base32_secret"
  }
}
```

### POST /api/auth/2fa/verify
Verify 2FA code (requires authentication).

**Request Body:**
```json
{
  "code": "123456"
}
```

### GET /api/auth/verify
Verify current session (requires authentication).

---

## 2. User Endpoints

### GET /api/users/profile
Get current user's profile (requires authentication).

### PUT /api/users/profile
Update current user's profile (requires authentication).

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Software developer"
}
```

### PUT /api/users/avatar
Upload user avatar (requires authentication, multipart/form-data).

### PUT /api/users/password
Change password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

### GET /api/users/:id
Get user profile by ID.

### GET /api/users/sessions
Get active sessions (requires authentication).

### DELETE /api/users/sessions/:id
Delete specific session (requires authentication).

### GET /api/users/:id/achievements
Get user achievements.

### GET /api/users/:id/purchases
Get user purchase history (requires authentication).

### GET /api/users/stats/:id
Get user statistics.

### POST /api/users/:id/follow
Follow a user (requires authentication).

### DELETE /api/users/:id/unfollow
Unfollow a user (requires authentication).

### GET /api/users/:id/followers
Get user's followers.

### GET /api/users/search
Search for users.

**Query Parameters:**
- `q`: Search query
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

### DELETE /api/users/account
Delete user account (requires authentication).

---

## 3. Module Endpoints

### GET /api/modules
Get all modules.

**Query Parameters:**
- `page`: Page number
- `limit`: Results per page
- `search`: Search query
- `level`: Filter by difficulty level

### GET /api/modules/trending
Get trending modules.

### GET /api/modules/recommended
Get recommended modules (requires authentication).

### GET /api/modules/category/:category
Get modules by category.

### GET /api/modules/:id
Get module by ID.

### POST /api/modules/:id/start
Start a module (requires authentication).

### GET /api/modules/:id/content
Get module content (requires authentication).

### POST /api/modules/:id/complete
Complete a module (requires authentication).

### GET /api/modules/quizzes
Get all quizzes (requires authentication).

### GET /api/modules/quizzes/:id
Get quiz by ID (requires authentication).

### POST /api/modules/quizzes/:id/start
Start a quiz attempt (requires authentication).

### POST /api/modules/quizzes/:id/submit
Submit quiz answers (requires authentication).

**Request Body:**
```json
{
  "attemptId": "attempt_id",
  "answers": {
    "0": 1,
    "1": 2,
    "2": 0
  }
}
```

### GET /api/modules/quizzes/:id/results
Get quiz results (requires authentication).

### GET /api/modules/events
Get all events.

### GET /api/modules/events/:id
Get event by ID.

### POST /api/modules/events/:id/register
Register for event (requires authentication).

### DELETE /api/modules/events/:id/unregister
Unregister from event (requires authentication).

### GET /api/modules/meetings
Get all meetings (requires authentication).

### GET /api/modules/meetings/:id
Get meeting by ID (requires authentication).

### POST /api/modules/meetings/:id/join
Join a meeting (requires authentication).

---

## 4. Quiz Endpoints (Standalone)

### GET /api/quizzes
Get all quizzes with filtering.

**Query Parameters:**
- `page`: Page number
- `limit`: Results per page
- `moduleId`: Filter by module
- `difficulty`: Filter by difficulty
- `search`: Search query

### GET /api/quizzes/motorization
Get motorization-related quizzes.

### GET /api/quizzes/user/attempts
Get current user's quiz attempts (requires authentication).

**Query Parameters:**
- `page`: Page number
- `limit`: Results per page
- `completed`: Filter by completion status (true/false)

### GET /api/quizzes/:id
Get quiz by ID with questions.

### POST /api/quizzes/:id/start
Start a quiz attempt (requires authentication).

### POST /api/quizzes/:id/submit
Submit quiz answers (requires authentication).

**Request Body:**
```json
{
  "attemptId": "attempt_id",
  "answers": {
    "0": 1,
    "1": 2,
    "2": 0
  }
}
```

### GET /api/quizzes/:id/results
Get quiz results for current user (requires authentication).

### GET /api/quizzes/:id/leaderboard
Get quiz leaderboard.

**Query Parameters:**
- `limit`: Number of top users (default: 50)

---

## 5. Progress Endpoints

### GET /api/progress
Get current user's progress (requires authentication).

### GET /api/progress/statistics
Get progress statistics (requires authentication).

### GET /api/progress/chart
Get progress chart data (requires authentication).

### GET /api/progress/streak
Get current streak (requires authentication).

### POST /api/progress/streak/reset
Reset streak (requires authentication).

### GET /api/progress/calendar
Get activity calendar (requires authentication).

### GET /api/progress/time-spent
Get time spent on learning (requires authentication).

### GET /api/progress/completion-rate
Get completion rate (requires authentication).

### GET /api/progress/export
Export progress data (requires authentication).

### GET /api/progress/goals
Get user goals (requires authentication).

### POST /api/progress/goals
Create a new goal (requires authentication).

**Request Body:**
```json
{
  "title": "Complete 10 modules",
  "description": "Finish 10 modules this month",
  "targetValue": 10,
  "deadline": "2024-12-31"
}
```

### GET /api/progress/module/:moduleId
Get progress for specific module (requires authentication).

---

## 6. Ranking Endpoints

### GET /api/ranking/global
Get global leaderboard.

**Query Parameters:**
- `page`: Page number
- `limit`: Results per page

### GET /api/ranking/monthly
Get monthly leaderboard.

### GET /api/ranking/me
Get current user's ranking position (requires authentication).

### GET /api/ranking/user/:id
Get specific user's ranking.

### GET /api/ranking/level/:level
Get ranking by level.

### GET /api/ranking/achievements
Get all available achievements.

### GET /api/ranking/achievements/:id
Get specific achievement details.

### GET /api/ranking/badges
Get current user's badges (requires authentication).

---

## 7. Shop Endpoints

### GET /api/shop/products
Get all products.

**Query Parameters:**
- `page`: Page number
- `limit`: Results per page
- `category`: Filter by category
- `search`: Search query

### GET /api/shop/products/:id
Get product by ID.

### GET /api/shop/categories
Get all product categories.

### GET /api/shop/categories/:categoryId/products
Get products by category.

### GET /api/shop/search
Search products.

**Query Parameters:**
- `q`: Search query
- `page`: Page number
- `limit`: Results per page

### GET /api/shop/filter
Filter products.

**Query Parameters:**
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `category`: Category ID
- `inStock`: Filter in-stock items (true/false)

### POST /api/shop/cart
Add item to cart (requires authentication).

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 1
}
```

### GET /api/shop/cart
Get user's cart (requires authentication).

### PUT /api/shop/cart/:id
Update cart item (requires authentication).

**Request Body:**
```json
{
  "quantity": 2
}
```

### DELETE /api/shop/cart/:id
Remove item from cart (requires authentication).

### DELETE /api/shop/cart
Clear entire cart (requires authentication).

### POST /api/shop/checkout
Checkout and create order (requires authentication).

**Request Body:**
```json
{
  "paymentMethod": "card",
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Warsaw",
    "postalCode": "00-001",
    "country": "Poland"
  }
}
```

### GET /api/shop/orders
Get user's orders (requires authentication).

### GET /api/shop/orders/:id
Get specific order (requires authentication).

### GET /api/shop/wishlist
Get user's wishlist (requires authentication).

### POST /api/shop/wishlist
Add item to wishlist (requires authentication).

**Request Body:**
```json
{
  "productId": "product_id"
}
```

### DELETE /api/shop/wishlist/:id
Remove item from wishlist (requires authentication).

### GET /api/shop/recommendations
Get product recommendations.

---

## 8. Chat Endpoints

### GET /api/chat/messages
Get chat messages (requires authentication).

**Query Parameters:**
- `page`: Page number
- `limit`: Results per page
- `roomId`: Filter by room

### POST /api/chat/messages
Send a message (requires authentication).

**Request Body:**
```json
{
  "roomId": "room_id",
  "content": "Hello!",
  "encrypted": true
}
```

### GET /api/chat/messages/:id
Get specific message (requires authentication).

### PUT /api/chat/messages/:id
Update message (requires authentication).

**Request Body:**
```json
{
  "content": "Updated message"
}
```

### DELETE /api/chat/messages/:id
Delete message (requires authentication - admin only).

### GET /api/chat/users
Get chat users (requires authentication).

### GET /api/chat/notifications
Get chat notifications (requires authentication).

### POST /api/chat/upload
Upload file to chat (requires authentication, multipart/form-data).

### GET /api/chat/typing
Get typing status (requires authentication).

### POST /api/chat/messages/:messageId/reactions
Add reaction to message (requires authentication).

**Request Body:**
```json
{
  "emoji": "👍"
}
```

### GET /api/chat/mentions
Get user mentions (requires authentication).

### GET /api/chat/stats
Get chat statistics (requires authentication).

---

## 9. Admin Endpoints

All admin endpoints require admin authentication.

### Dashboard & Analytics

#### GET /api/admin/dashboard
Get admin dashboard data.

#### GET /api/admin/statistics
Get system statistics.

#### GET /api/admin/analytics
Get analytics data.

**Query Parameters:**
- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)

#### GET /api/admin/logs
Get system logs.

**Query Parameters:**
- `level`: Log level (info, warn, error)
- `page`: Page number
- `limit`: Results per page

### User Management

#### GET /api/admin/users
Get all users with pagination.

**Query Parameters:**
- `page`: Page number
- `limit`: Results per page
- `search`: Search query
- `role`: Filter by role

#### GET /api/admin/users/:id
Get specific user details.

#### POST /api/admin/users
Create new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePassword123!",
  "role": "USER"
}
```

#### PUT /api/admin/users/:id
Update user.

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "username": "newusername"
}
```

#### DELETE /api/admin/users/:id
Delete user.

#### POST /api/admin/users/:id/ban
Ban user.

#### POST /api/admin/users/:id/unban
Unban user.

#### POST /api/admin/users/:id/suspend
Suspend user.

#### POST /api/admin/users/:id/activate
Activate user.

#### POST /api/admin/users/:id/role
Assign role to user.

**Request Body:**
```json
{
  "role": "MODERATOR"
}
```

#### GET /api/admin/users/:id/activity
Get user activity.

#### GET /api/admin/users/:id/sessions
Get user sessions.

#### DELETE /api/admin/users/:id/sessions/:sessionId
Revoke user session.

#### POST /api/admin/users/:id/reset-password
Reset user password.

**Request Body:**
```json
{
  "newPassword": "NewSecurePassword123!"
}
```

#### GET /api/admin/users/export
Export users as CSV.

### Shop Management

#### GET /api/admin/shop/products
Get all products (admin view).

#### POST /api/admin/shop/products
Create new product.

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "categoryId": "category_id",
  "stock": 100
}
```

#### PUT /api/admin/shop/products/:id
Update product.

#### DELETE /api/admin/shop/products/:id
Delete product.

#### GET /api/admin/shop/orders
Get all orders.

#### GET /api/admin/shop/orders/:id
Get specific order.

#### PUT /api/admin/shop/orders/:id/status
Update order status.

**Request Body:**
```json
{
  "status": "SHIPPED"
}
```

#### GET /api/admin/shop/stats/products
Get product statistics.

#### GET /api/admin/shop/stats/orders
Get order statistics.

### Module Management

#### GET /api/admin/modules
Get all modules (admin view).

#### POST /api/admin/modules
Create new module.

**Request Body:**
```json
{
  "title": "Module Title",
  "description": "Module description",
  "category": "Security",
  "difficulty": "INTERMEDIATE",
  "points": 100,
  "content": "Module content..."
}
```

#### PUT /api/admin/modules/:id
Update module.

#### DELETE /api/admin/modules/:id
Delete module.

#### GET /api/admin/modules/:id/enrollments
Get module enrollments.

#### POST /api/admin/modules/:id/publish
Publish module.

#### POST /api/admin/modules/:id/unpublish
Unpublish module.

#### GET /api/admin/modules/stats
Get module statistics.

#### POST /api/admin/modules/categories
Create module category.

**Request Body:**
```json
{
  "name": "Category Name",
  "description": "Category description"
}
```

#### PUT /api/admin/modules/categories/:id
Update module category.

### System Operations

#### POST /api/admin/backup
Create system backup.

#### GET /api/admin/audit-logs
Get audit logs.

**Query Parameters:**
- `action`: Filter by action
- `userId`: Filter by user
- `page`: Page number
- `limit`: Results per page

---

## WebSocket Events

Connect to WebSocket at `ws://localhost:5000` with authentication token.

### Client → Server Events

- `message:send` - Send a chat message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `room:join` - Join a chat room
- `room:leave` - Leave a chat room

### Server → Client Events

- `message:new` - New message received
- `message:update` - Message updated
- `message:delete` - Message deleted
- `typing:user` - User typing status
- `notification` - New notification
- `user:online` - User came online
- `user:offline` - User went offline

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- Password Reset: 3 requests per hour

---

## Security Headers

All responses include security headers:
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`
- `Content-Security-Policy`

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

## End-to-End Encryption (Chat)

Chat messages support E2E encryption using libsodium:

1. Generate keypair on client
2. Exchange public keys with other users
3. Encrypt messages before sending
4. Decrypt messages after receiving

**Encryption Details:**
- Algorithm: XSalsa20-Poly1305
- Key Exchange: X25519
- Library: libsodium-wrappers

---

For more information, see the [Backend README](./README.md).
