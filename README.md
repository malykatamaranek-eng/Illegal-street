# Illegal Street - Complete Platform

A comprehensive learning and e-commerce platform with real-time chat, gamification, and admin management.

## 🎯 Overview

Illegal Street is a full-stack TypeScript application featuring:

- **130+ RESTful API Endpoints** - Complete backend with authentication, authorization, and business logic
- **Real-time Chat** - WebSocket-powered chat with E2E encryption support
- **Learning Platform** - Modules, quizzes, progress tracking, and achievements
- **E-commerce** - Complete shop with cart, orders, and wishlist
- **Admin Panel** - Comprehensive administration interface
- **Gamification** - Points, levels, streaks, rankings, and badges
- **Security** - JWT authentication, bcrypt, rate limiting, input validation

## 📁 Project Structure

```
Illegal-street/
├── Backend/              # TypeScript Node.js API
│   ├── src/             # TypeScript source code
│   │   ├── controllers/ # API endpoint handlers (9 files)
│   │   ├── services/    # Business logic (15 files)
│   │   ├── routes/      # API route definitions (9 files)
│   │   ├── middleware/  # Express middleware
│   │   ├── websocket/   # Socket.io chat gateway
│   │   ├── config/      # Configuration files
│   │   └── utils/       # Utility functions
│   ├── prisma/          # Database schema and migrations
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── API_DOCUMENTATION.md    # Complete API docs
│   ├── DEPLOYMENT_GUIDE.md     # Deployment instructions
│   └── README.md               # Backend documentation
│
└── Frontend/            # Frontend application
    ├── dashboard.html   # Main dashboard (559 lines)
    ├── modules.html     # Learning modules (227 lines)
    ├── progress.html    # Progress tracking (348 lines)
    ├── ranking.html     # Leaderboards (115 lines)
    ├── settings.html    # User settings (169 lines)
    ├── chat.html        # Real-time chat
    ├── shop.html        # E-commerce shop (111 lines)
    ├── admin.html       # Admin panel
    └── *.js             # JavaScript files (~7,700 lines)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- npm 9+

### Backend Setup

```bash
cd Backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run migrate

# Seed database (creates 3 admin users)
npm run prisma:seed

# Build TypeScript
npm run build

# Start server
npm start
# Or development mode:
npm run dev
```

### Frontend Setup

```bash
cd Frontend

# Serve with any static file server
# Example with Python:
python -m http.server 8080

# Or with Node.js http-server:
npx http-server -p 8080
```

## 📚 Documentation

- **[Backend README](./Backend/README.md)** - Backend setup and architecture
- **[API Documentation](./Backend/API_DOCUMENTATION.md)** - Complete API reference (130+ endpoints)
- **[Deployment Guide](./Backend/DEPLOYMENT_GUIDE.md)** - Production deployment instructions

## 🔐 Admin Credentials

After running the seed script, use these credentials to access the admin panel:

| Email | Password | Role |
|-------|----------|------|
| vitalik@illegal-street.io | `V1t@l1k_Secure#2024!` | SUPER_ADMIN |
| developer@illegal-street.io | `Dev3l0per_Safe@456!` | ADMIN |
| blazej@illegal-street.io | `Bl@zej_Fortress#789!` | ADMIN |

**⚠️ Change these passwords in production!**

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.7
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis (ioredis)
- **Queue**: Bull (Redis-based)
- **WebSocket**: Socket.io
- **Authentication**: JWT + bcrypt
- **Validation**: Express-validator + Zod
- **Security**: Helmet, rate limiting, CORS
- **Logging**: Winston + Sentry
- **File Storage**: Multer + AWS S3
- **Email**: Nodemailer
- **Encryption**: libsodium-wrappers
- **Testing**: Jest + Supertest

### Frontend

- **HTML5** - Semantic markup
- **CSS3** - Modern styling
- **JavaScript ES6+** - Client-side logic
- **Socket.io Client** - Real-time communication
- **Encryption** - libsodium for E2E chat

## 📊 API Endpoints

### Authentication (10 endpoints)
- Register, login, logout, refresh token
- Password reset, email verification
- 2FA setup and verification

### Users (15 endpoints)
- Profile management
- Avatar upload
- Password change
- Session management
- Social features (follow/unfollow)
- User search

### Modules (20 endpoints)
- Module CRUD
- Start/complete modules
- Quizzes (integrated)
- Events registration
- Meetings

### Quizzes (8 endpoints - standalone)
- Get all quizzes
- Start quiz attempt
- Submit answers
- View results
- Leaderboard
- Motorization quizzes

### Progress (12 endpoints)
- Progress tracking
- Statistics and charts
- Streaks and goals
- Activity calendar
- Time spent
- Progress export

### Ranking (8 endpoints)
- Global leaderboard
- Monthly rankings
- User position
- Achievements
- Badges

### Shop (18 endpoints)
- Product catalog
- Categories
- Shopping cart
- Checkout
- Orders
- Wishlist
- Product recommendations

### Chat (12 endpoints)
- Send/receive messages
- E2E encryption support
- File uploads
- Reactions
- Typing indicators
- Mentions

### Admin (35+ endpoints)
- User management (ban, suspend, activate)
- Shop management (products, orders)
- Module management (create, publish)
- Analytics and statistics
- System operations

## 🔌 WebSocket Events

Real-time features via Socket.io:

**Client → Server:**
- `message:send` - Send chat message
- `typing:start/stop` - Typing indicators
- `room:join/leave` - Room management

**Server → Client:**
- `message:new` - New message
- `message:update/delete` - Message changes
- `typing:user` - User typing
- `notification` - System notifications
- `user:online/offline` - Presence

## 🔒 Security Features

- ✅ **Authentication**: JWT with refresh tokens
- ✅ **Password Hashing**: bcrypt with configurable rounds
- ✅ **Rate Limiting**: Per-endpoint request limits
- ✅ **Input Validation**: Express-validator + Zod schemas
- ✅ **SQL Injection Prevention**: Prisma ORM
- ✅ **XSS Protection**: Input sanitization
- ✅ **CSRF Protection**: SameSite cookies
- ✅ **Security Headers**: Helmet middleware
- ✅ **CORS**: Configurable origins
- ✅ **E2E Encryption**: libsodium for chat
- ✅ **Session Management**: Redis-backed sessions
- ✅ **Audit Logging**: Admin action tracking

## 🎮 Features

### Learning Platform
- 📚 Educational modules with difficulty levels
- ❓ Interactive quizzes with scoring
- 📈 Progress tracking and statistics
- 🎯 Personal goals and achievements
- 📅 Activity calendar
- ⏱️ Time spent tracking
- 🔥 Learning streaks

### Gamification
- ⭐ Points and levels system
- 🏆 Achievements and badges
- 📊 Global and monthly rankings
- 👥 Follow system
- 🎖️ User profiles

### E-commerce
- 🛍️ Product catalog
- 🛒 Shopping cart
- 💳 Checkout system
- 📦 Order management
- ❤️ Wishlist
- 🔍 Search and filters
- 💡 Recommendations

### Communication
- 💬 Real-time chat
- 🔐 E2E encryption support
- 📎 File uploads
- 😊 Reactions
- 👤 Mentions
- ⌨️ Typing indicators

### Administration
- 👥 User management
- 🛡️ Role-based access control
- 🏪 Shop administration
- 📚 Module management
- 📊 Analytics dashboard
- 📜 Audit logs
- 🔧 System operations

## 📦 Database Schema

### Core Models
- **User** - User accounts with authentication
- **Session** - Active user sessions
- **RefreshToken** - JWT refresh tokens
- **Admin** - Admin users with permissions

### Learning Models
- **Module** - Educational content
- **Course** - Module lessons
- **Quiz** - Assessments
- **QuizResult** - Quiz attempts and scores
- **UserProgress** - Learning progress
- **Achievement** - Unlockable achievements
- **Goal** - User learning goals
- **Event** - Learning events
- **Meeting** - Virtual meetings

### E-commerce Models
- **Product** - Shop products
- **ProductCategory** - Product categories
- **Order** - Customer orders
- **CartItem** - Shopping cart items
- **WishlistItem** - User wishlists

### Communication Models
- **ChatMessage** - Chat messages
- **Notification** - User notifications

## 🧪 Testing

```bash
cd Backend

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:ci
```

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📈 Development

### Available Scripts

**Backend:**
```bash
npm run dev          # Development server with hot reload
npm run build        # Build TypeScript
npm run start        # Production server
npm run typecheck    # Type checking
npm run lint         # ESLint
npm run format       # Prettier
npm test             # Jest tests
npm run migrate      # Run migrations
npm run prisma:seed  # Seed database
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

Copyright © 2024 Illegal Street Team

## 📞 Support

- 📧 Email: support@illegal-street.io
- 📖 Documentation: See docs folder
- 🐛 Issues: GitHub Issues
- 💬 Chat: In-app support

## 🙏 Acknowledgments

- TypeScript community
- Express.js team
- Prisma team
- Socket.io developers
- All contributors

---

**Built with ❤️ by the Illegal Street Team**
