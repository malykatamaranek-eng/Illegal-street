# 🚔 Illegal Street - Educational Road Safety Platform

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

> An interactive educational platform for learning road safety, traffic laws, and responsible driving through gamification, quizzes, and community engagement.

---

## 🎯 Project Overview

**Illegal Street** is a comprehensive web platform designed to educate users about road safety through:

- 📚 **Interactive Learning Modules** - Structured courses on traffic laws and safe driving
- 🎮 **Gamification System** - Points, levels, achievements, and rankings
- 📝 **Quizzes & Assessments** - Test your knowledge and track progress
- 💬 **Community Chat** - End-to-end encrypted discussions
- 🏪 **Rewards Shop** - Redeem points for prizes and recognition
- 👥 **Social Features** - Follow users, compete on leaderboards
- 🛡️ **Admin Dashboard** - Complete management and analytics

---

## ✨ Key Features

### For Users
- ✅ Comprehensive learning modules with progress tracking
- ✅ Interactive quizzes with instant feedback
- ✅ Gamified experience with points, levels, and streaks
- ✅ Global and friend rankings
- ✅ Achievement badges and goals
- ✅ Shop system to redeem earned points
- ✅ Secure end-to-end encrypted chat
- ✅ Event registration and attendance tracking
- ✅ Personalized dashboard and profile

### For Administrators
- ✅ Complete user management
- ✅ Content management (modules, quizzes, products)
- ✅ Analytics and reporting dashboard
- ✅ Moderation tools (chat, content review)
- ✅ System monitoring and health checks
- ✅ Bulk operations and data export
- ✅ Role-based access control

### Technical Features
- ✅ **Backend**: TypeScript + Express.js + Prisma ORM
- ✅ **Database**: PostgreSQL with full schema
- ✅ **Cache**: Redis for sessions and performance
- ✅ **Real-time**: WebSocket with Socket.io
- ✅ **Authentication**: JWT with refresh tokens
- ✅ **Security**: Helmet, rate limiting, input validation
- ✅ **File Upload**: Multer with S3 support ready
- ✅ **API**: 128+ RESTful endpoints
- ✅ **Docker**: Complete containerization
- ✅ **Testing**: Jest test infrastructure
- ✅ **Logging**: Winston with rotation
- ✅ **Encryption**: E2E chat encryption with libsodium

---

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/malykatamaranek-eng/Illegal-street.git
cd Illegal-street

# Start all services
docker-compose up -d --build

# Run database migrations and seed
docker exec illegal-street-backend npx prisma migrate deploy
docker exec illegal-street-backend npm run prisma:seed

# Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:3000
```

**📖 For detailed Docker setup, see [INSTALLATION.md](INSTALLATION.md)**

### Manual Setup (Development)

#### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6
- npm >= 9.0.0

#### Backend Setup

```bash
cd Backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npm run migrate

# Generate Prisma Client
npm run prisma:generate

# Seed database
npm run prisma:seed

# Start development server
npm run dev
```

#### Frontend Setup

```bash
cd Frontend

# Install dependencies (if any)
npm install

# Open in browser
# Use a local web server or open index.html
```

---

## 📁 Project Structure

```
Illegal-street/
├── Backend/                    # Node.js + TypeScript Backend
│   ├── src/
│   │   ├── controllers/       # 9 controllers (128+ endpoints)
│   │   ├── services/          # Business logic layer
│   │   ├── routes/            # API route definitions
│   │   ├── middleware/        # Auth, validation, security
│   │   ├── websocket/         # Socket.io chat gateway
│   │   ├── config/            # Configuration files
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Helper functions
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Database seeding
│   ├── Dockerfile
│   └── package.json
├── Frontend/                   # HTML/CSS/JS Frontend
│   ├── *.html                 # 8 main pages
│   ├── *.js                   # Page-specific JavaScript
│   ├── styles.css             # Global styles
│   ├── assets/                # Images, videos, icons
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml          # Multi-container orchestration
├── .env.docker                 # Docker environment config
├── INSTALLATION.md             # Detailed setup guide
└── README.md                   # This file
```

---

## 🎮 API Endpoints

### Authentication & Users (15 endpoints)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar
- And more...

### Modules & Learning (20 endpoints)
- `GET /api/modules` - List all modules
- `GET /api/modules/:id` - Get module details
- `POST /api/modules/:id/enroll` - Enroll in module
- `PUT /api/modules/:id/progress` - Update progress
- `GET /api/modules/:id/content` - Get module content
- And more...

### Quizzes (8 endpoints)
- `GET /api/quizzes` - List quizzes
- `GET /api/quizzes/:id` - Get quiz details
- `POST /api/quizzes/:id/submit` - Submit quiz answers
- `GET /api/quizzes/:id/results` - Get quiz results
- And more...

### Progress & Analytics (12 endpoints)
- `GET /api/progress` - Get user progress
- `GET /api/progress/stats` - Get statistics
- `GET /api/progress/history` - Get activity history
- `POST /api/progress/goals` - Set learning goals
- And more...

### Rankings (8 endpoints)
- `GET /api/ranking/global` - Global leaderboard
- `GET /api/ranking/friends` - Friends ranking
- `GET /api/ranking/achievements` - User achievements
- `POST /api/ranking/follow/:userId` - Follow user
- And more...

### Shop (18 endpoints)
- `GET /api/shop/products` - List products
- `POST /api/shop/cart` - Add to cart
- `GET /api/shop/cart` - Get cart
- `POST /api/shop/checkout` - Checkout
- `GET /api/shop/orders` - Order history
- And more...

### Chat (12 endpoints)
- `POST /api/chat/rooms` - Create chat room
- `GET /api/chat/rooms` - List rooms
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages/:roomId` - Get messages
- `PUT /api/chat/messages/:id` - Edit message
- WebSocket for real-time messaging
- And more...

### Admin (35+ endpoints)
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/analytics` - System analytics
- `POST /api/admin/modules` - Create module
- `PUT /api/admin/modules/:id` - Update module
- And many more admin operations...

**📚 Total: 128+ API endpoints**

---

## 🗄️ Database Schema

The application uses PostgreSQL with the following main models:

- **User** - User accounts and profiles
- **Admin** - Administrator accounts
- **Module** - Learning modules and courses
- **Quiz** - Quizzes and assessments
- **Question** - Quiz questions
- **UserProgress** - Learning progress tracking
- **QuizResult** - Quiz attempt results
- **Achievement** - User achievements and badges
- **Product** - Shop products
- **Order** - Purchase orders
- **CartItem** - Shopping cart
- **ChatMessage** - Encrypted chat messages
- **ChatRoom** - Chat room management
- **Event** - Educational events
- **EventRegistration** - Event attendance
- **Notification** - User notifications
- **UserActivity** - Activity logging
- **Goal** - User learning goals
- **Session** - Active sessions
- **RefreshToken** - JWT refresh tokens

**📖 For complete schema details, see Backend/prisma/schema.prisma**

---

## 🔒 Security Features

- ✅ **JWT Authentication** - Secure token-based auth with refresh tokens
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Rate Limiting** - Prevent brute force and DDoS
- ✅ **Input Validation** - Zod schemas and express-validator
- ✅ **SQL Injection Protection** - Prisma ORM parameterized queries
- ✅ **XSS Protection** - Helmet middleware
- ✅ **CORS Configuration** - Controlled cross-origin access
- ✅ **End-to-End Encryption** - libsodium for chat messages
- ✅ **Secure Headers** - Security headers with Helmet
- ✅ **HTTPS Ready** - SSL/TLS configuration ready
- ✅ **Session Management** - Secure session handling
- ✅ **File Upload Validation** - Mime type and size checks
- ✅ **Role-Based Access Control** - Granular permissions

---

## 🧪 Testing

```bash
cd Backend

# Run all tests
npm test

# Run tests with coverage
npm run test

# Run tests in watch mode
npm run test:watch

# Run CI tests
npm run test:ci
```

---

## 🛠️ Development

### Backend Development

```bash
cd Backend

# Start with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run typecheck
```

### Database Management

```bash
# Create migration
npm run migrate

# Deploy migrations
npm run migrate:deploy

# Reset database
npm run migrate:reset

# Open Prisma Studio
npm run prisma:studio

# Generate Prisma Client
npm run prisma:generate

# Seed database
npm run prisma:seed
```

---

## 👥 Default Admin Accounts

After seeding the database:

| Email | Password | Role |
|-------|----------|------|
| vitalik@illegal-street.io | V1t@l1k_Secure#2024! | SUPER_ADMIN |
| developer@illegal-street.io | Dev3l0per_Safe@456! | ADMIN |
| blazej@illegal-street.io | Bl@zej_Fortress#789! | ADMIN |

**⚠️ Change these passwords immediately in production!**

---

## 📊 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.7
- **Framework**: Express.js 4.21
- **ORM**: Prisma 5.22
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **WebSocket**: Socket.io 4.8
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod + express-validator
- **Security**: Helmet, bcrypt, rate-limit
- **Encryption**: libsodium-wrappers
- **File Upload**: Multer
- **Email**: Nodemailer
- **Logging**: Winston
- **Testing**: Jest

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling
- **JavaScript (ES6+)** - Interactive functionality
- **WebSocket** - Real-time features

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Git** - Version control

---

## 🌐 Deployment

### Docker Production Deployment

```bash
# Build for production
docker-compose -f docker-compose.yml up -d --build

# Scale services
docker-compose up -d --scale backend=3

# View logs
docker-compose logs -f
```

### Environment Configuration

Update `.env.docker` for production:
- Strong passwords
- Production database URL
- Secure JWT secrets
- Production CORS origins
- SMTP credentials
- SSL certificates

---

## 📈 Performance

- **Response Time**: < 100ms (average)
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Database Connection Pooling**: Optimized with Prisma
- **Redis Caching**: Session and frequently accessed data
- **Compression**: Gzip compression enabled
- **File Upload**: Chunked uploads, max 10MB

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 📞 Contact & Support

- **GitHub**: [malykatamaranek-eng/Illegal-street](https://github.com/malykatamaranek-eng/Illegal-street)
- **Issues**: [GitHub Issues](https://github.com/malykatamaranek-eng/Illegal-street/issues)

---

## 🙏 Acknowledgments

- Educational content based on official traffic regulations
- Icons and assets from open-source libraries
- Community feedback and contributions

---

**Made with ❤️ for safer roads and responsible driving education**

---

## 🗺️ Roadmap

### Completed ✅
- Full backend API implementation
- Complete frontend pages
- Docker containerization
- WebSocket chat system
- Admin dashboard
- Gamification system
- Authentication & authorization
- Database schema with migrations

### Upcoming 🚧
- Mobile app (React Native)
- Video course content
- AI-powered question generation
- Multi-language support (i18n)
- Advanced analytics dashboard
- Integration with driving schools
- Certificate generation
- Social media integration

---

**Start learning safe driving today! 🚗💨**
