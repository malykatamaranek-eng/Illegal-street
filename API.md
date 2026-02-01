# Illegal Street Backend API Documentation

## Overview

Complete REST API for the Illegal Street platform with 128+ endpoints across 9 controller modules.

**Base URL**: `http://localhost:3000/api`  
**Authentication**: JWT Bearer Token (for protected routes)

---

## Authentication Endpoints

Base: `/api/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | User login | No |
| POST | `/logout` | User logout | Yes |
| POST | `/register` | User registration | No |
| POST | `/refresh` | Refresh access token | Yes |
| GET | `/verify-email` | Verify email address | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password | No |

---

## User Endpoints

Base: `/api/users`

### Profile Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get current user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| POST | `/avatar` | Upload profile avatar | Yes |
| PUT | `/password` | Change password | Yes |
| DELETE | `/account` | Delete account | Yes |

### Sessions
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/sessions` | Get active sessions | Yes |
| DELETE | `/sessions/:id` | Logout specific session | Yes |
| GET | `/sessions/current` | Get current session | Yes |

### Social
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/:userId/follow` | Follow user | Yes |
| DELETE | `/:userId/follow` | Unfollow user | Yes |
| GET | `/:userId/followers` | Get user followers | Yes |
| GET | `/:userId/following` | Get users following | Yes |

### Data
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/achievements` | Get user achievements | Yes |
| GET | `/purchases` | Get purchase history | Yes |
| GET | `/:userId/public` | Get public profile | No |

---

## Module Endpoints

Base: `/api/modules`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all modules | Yes |
| GET | `/:id` | Get module by ID | Yes |
| GET | `/category/:category` | Get modules by category | Yes |
| POST | `/:id/start` | Start module | Yes |
| POST | `/:id/complete` | Complete module | Yes |
| GET | `/:id/content` | Get module content | Yes |
| GET | `/trending` | Get trending modules | Yes |
| GET | `/recommended` | Get recommended modules | Yes |

### Events
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/events` | Get all events | Yes |
| GET | `/events/:id` | Get event by ID | Yes |
| POST | `/events/:id/register` | Register for event | Yes |
| DELETE | `/events/:id/register` | Unregister from event | Yes |
| PUT | `/events/:id/attendance` | Update attendance | Yes |
| GET | `/events/:id/attendees` | Get event attendees | Yes |

### Meetings
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/meetings` | Get all meetings | Yes |
| GET | `/meetings/:id` | Get meeting by ID | Yes |
| POST | `/meetings/:id/join` | Join meeting | Yes |
| POST | `/meetings/:id/leave` | Leave meeting | Yes |
| GET | `/meetings/:id/participants` | Get participants | Yes |
| PUT | `/meetings/:id/status` | Update meeting status | Yes |

---

## Quiz Endpoints

Base: `/api/quizzes`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all quizzes | Yes |
| GET | `/:id` | Get quiz by ID | Yes |
| POST | `/:id/start` | Start quiz | Yes |
| POST | `/:id/submit` | Submit quiz | Yes |
| GET | `/:id/results` | Get quiz results | Yes |
| GET | `/user` | Get user's quizzes | Yes |
| GET | `/motoryzation` | Get motoryzation quizzes | Yes |
| GET | `/leaderboard` | Get quiz leaderboard | Yes |

---

## Progress Endpoints

Base: `/api/progress`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user progress | Yes |
| GET | `/module/:moduleId` | Get progress by module | Yes |
| GET | `/statistics` | Get progress statistics | Yes |
| GET | `/chart` | Get progress chart | Yes |
| GET | `/streak` | Get user streak | Yes |
| DELETE | `/streak` | Reset streak | Yes |
| GET | `/calendar` | Get activity calendar | Yes |
| GET | `/time-spent` | Get time spent | Yes |
| GET | `/completion-rate` | Get completion rate | Yes |
| GET | `/export` | Export progress data | Yes |
| GET | `/goals` | Get user goals | Yes |
| POST | `/goals` | Create new goal | Yes |

---

## Ranking Endpoints

Base: `/api/ranking`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/global` | Get global ranking | Yes |
| GET | `/monthly` | Get monthly ranking | Yes |
| GET | `/position` | Get user position | Yes |
| GET | `/user/:userId` | Get user ranking | Yes |
| GET | `/level/:level` | Get ranking by level | Yes |
| GET | `/achievements` | Get all achievements | Yes |
| GET | `/achievements/:id` | Get achievement by ID | Yes |
| GET | `/badges` | Get all badges | Yes |

---

## Shop Endpoints

Base: `/api/shop`

### Products
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | Get all products | Yes |
| GET | `/products/:id` | Get product by ID | Yes |
| GET | `/categories` | Get categories | Yes |
| GET | `/categories/:id/products` | Get products by category | Yes |
| GET | `/products/search` | Search products | Yes |
| POST | `/products/filter` | Filter products | Yes |

### Cart
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/cart` | Add to cart | Yes |
| GET | `/cart` | Get cart | Yes |
| PUT | `/cart/:itemId` | Update cart item | Yes |
| DELETE | `/cart/:itemId` | Remove from cart | Yes |
| DELETE | `/cart` | Clear cart | Yes |
| POST | `/checkout` | Checkout | Yes |

### Orders
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/orders` | Get user orders | Yes |
| GET | `/orders/:id` | Get order by ID | Yes |

### Wishlist
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/wishlist` | Get wishlist | Yes |
| POST | `/wishlist` | Add to wishlist | Yes |
| DELETE | `/wishlist/:productId` | Remove from wishlist | Yes |
| GET | `/recommendations` | Get recommendations | Yes |

---

## Chat Endpoints (E2E Encrypted)

Base: `/api/chat`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/messages` | Get messages (E2E encrypted) | Yes |
| POST | `/messages` | Send message (E2E encrypted) | Yes |
| GET | `/messages/:id` | Get message by ID | Yes |
| PUT | `/messages/:id` | Update message | Yes |
| DELETE | `/messages/:id` | Delete message (ADMIN) | Yes |
| GET | `/users` | Get chat users | Yes |
| GET | `/notifications` | Get chat notifications | Yes |
| POST | `/upload` | Upload file | Yes |
| GET | `/typing/:userId` | Get typing status | Yes |
| POST | `/reactions` | Add reaction | Yes |
| GET | `/mentions` | Get user mentions | Yes |
| GET | `/statistics` | Get chat statistics | Yes |

---

## Admin Endpoints

Base: `/api/admin`

**Note**: All admin endpoints require ADMIN or SUPER_ADMIN role.

### User Management (15 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | Get all users | Admin |
| POST | `/users` | Create user | Admin |
| PUT | `/users/:id` | Update user | Admin |
| DELETE | `/users/:id` | Delete user | Admin |
| POST | `/users/:id/reset-password` | Reset password | Admin |
| POST | `/users/:id/ban` | Ban user | Admin |
| POST | `/users/:id/unban` | Unban user | Admin |
| DELETE | `/users/:id/sessions` | Logout user sessions | Admin |
| GET | `/users/:id/sessions` | Get user sessions | Admin |
| GET | `/users/:id/activity` | Get user activity | Admin |
| POST | `/users/:id/role` | Grant role | Admin |
| DELETE | `/users/:id/role` | Revoke role | Admin |
| GET | `/users/search` | Search users | Admin |
| GET | `/users/export` | Export users | Admin |
| POST | `/users/import` | Import users | Admin |

### Shop Management (10 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/shop/products` | Get shop products | Admin |
| POST | `/shop/products` | Create product | Admin |
| PUT | `/shop/products/:id` | Update product | Admin |
| DELETE | `/shop/products/:id` | Delete product | Admin |
| POST | `/shop/products/:id/images` | Upload product images | Admin |
| GET | `/shop/categories` | Get categories | Admin |
| POST | `/shop/categories` | Create category | Admin |
| PUT | `/shop/categories/:id` | Update category | Admin |
| DELETE | `/shop/categories/:id` | Delete category | Admin |
| GET | `/shop/orders` | Get all orders | Admin |

### Module Management (8 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/modules` | Get modules | Admin |
| POST | `/modules` | Create module | Admin |
| PUT | `/modules/:id` | Update module | Admin |
| DELETE | `/modules/:id` | Delete module | Admin |
| GET | `/quizzes` | Get quizzes | Admin |
| POST | `/quizzes` | Create quiz | Admin |
| PUT | `/quizzes/:id` | Update quiz | Admin |
| DELETE | `/quizzes/:id` | Delete quiz | Admin |

### Statistics
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard` | Get admin dashboard | Admin |
| GET | `/statistics` | Get statistics | Admin |

---

## WebSocket Events

**Connection**: `ws://localhost:3000`

### Chat Events
- `connection` - User connected
- `disconnect` - User disconnected
- `message:send` - Send message (E2E encrypted)
- `message:received` - Receive message
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `user:online` - User came online
- `user:offline` - User went offline

---

## Response Formats

### Success Response
```json
{
  "status": "success",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Rate Limiting

- Window: 15 minutes
- Max requests: 100 per window
- Exceeded: 429 Too Many Requests

---

## Security Features

- ✅ JWT Authentication
- ✅ E2E Encryption for Chat
- ✅ Rate Limiting
- ✅ CORS Protection
- ✅ Helmet Security Headers
- ✅ Input Validation
- ✅ SQL Injection Prevention
- ✅ XSS Protection

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

**Last Updated**: 2026-02-01  
**Version**: 1.0.0
