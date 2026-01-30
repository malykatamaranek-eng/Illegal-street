# Frontend-Backend Integration Guide

## Overview
This project now includes complete frontend-backend integration with secure JWT-based authentication using HTTP-Only cookies.

## Setup Instructions

### 1. Backend Setup

#### Install Dependencies
```bash
cd Backend
npm install
```

#### Configure Environment
1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the following variables in `.env`:
```env
# Database Configuration
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=illegal_street_db

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long

# CORS Origins (add your frontend URL)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

#### Initialize Database
1. Create the database using the schema:
```bash
mysql -u root -p < database/schema.sql
```

#### Start Backend Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will start on `http://localhost:3000` by default.

### 2. Frontend Setup

The frontend is ready to use. Simply serve the Frontend directory using any web server:

```bash
# Option 1: Using Python
cd Frontend
python3 -m http.server 8080

# Option 2: Using Node's http-server
npx http-server Frontend -p 8080

# Option 3: Using the backend (already configured)
# The backend serves frontend files automatically
```

## Authentication Flow

### Login Process

1. **User submits login form** (`login.html`)
   - Frontend validates input (username/email and password)
   - `login.js` calls `API.auth.login(username, password, remember)`

2. **Frontend sends request** (`api.js`)
   - POST to `/api/auth/login`
   - Automatic `credentials: 'include'` for cookie support
   - JSON body: `{ username, password, remember }`

3. **Backend processes login** (`authController.js`)
   - Validates credentials against database
   - Checks for account locks and failed attempts
   - Hashes password comparison using bcrypt
   - Generates JWT token
   - Sets HTTP-Only cookie with JWT
   - Returns user data and token

4. **Frontend receives response**
   - Stores JWT token in localStorage (backup)
   - Stores user data in localStorage
   - Redirects to main page

### Session Verification

To check if a user is authenticated:

```javascript
// Frontend
API.auth.verify()
  .then(response => {
    console.log('User is authenticated:', response.data.user);
  })
  .catch(error => {
    console.log('User is not authenticated');
  });
```

Backend endpoint: `GET /api/auth/verify`

### Protected Routes

Backend routes can be protected using the `protect` middleware:

```javascript
const { protect } = require('../middleware/auth');

router.get('/protected', protect, (req, res) => {
  // req.user contains authenticated user data
  res.json({ message: 'Protected data', user: req.user });
});
```

### Logout Process

```javascript
// Frontend
API.auth.logout()
  .then(() => {
    console.log('Logged out successfully');
    window.location.href = 'login.html';
  });
```

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`
Login user and receive JWT token.

**Request:**
```json
{
  "username": "user@example.com",
  "password": "password123",
  "remember": true
}
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "Zalogowano pomyślnie",
  "token": "eyJhbGci...",
  "data": {
    "user": {
      "id": 1,
      "username": "user",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

#### GET `/api/auth/verify`
Verify current session and get user data.

**Response (Success):**
```json
{
  "status": "success",
  "message": "Sesja aktywna",
  "authenticated": true,
  "data": {
    "user": {
      "id": 1,
      "username": "user",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

#### POST `/api/auth/logout`
Logout user and clear JWT cookie.

**Response:**
```json
{
  "status": "success",
  "message": "Wylogowano pomyślnie"
}
```

#### POST `/api/auth/register`
Register new user (admin only).

#### GET `/api/auth/me`
Get current user profile (protected route).

#### POST `/api/auth/refresh-token`
Refresh JWT token.

## Security Features

### Cookies
- **HTTP-Only**: Prevents XSS attacks from accessing cookies
- **Secure**: Only sent over HTTPS in production
- **SameSite=Strict**: Prevents CSRF attacks

### JWT Tokens
- Stored in both cookie (primary) and localStorage (backup)
- Cookie is always checked first
- Authorization header supported as fallback
- Automatic expiration handling

### Password Security
- Bcrypt hashing (12 rounds by default)
- Account lockout after failed attempts
- Failed login attempt tracking

### Input Validation
- Frontend validation for immediate feedback
- Backend validation using express-validator
- SQL injection prevention via parameterized queries
- XSS protection via input sanitization

### Rate Limiting
- Global rate limit for all API endpoints
- Stricter rate limits for authentication endpoints
- IP-based tracking

## Frontend API Usage

### Using the API Module

The `api.js` module provides a centralized way to communicate with the backend:

```javascript
// Login
API.auth.login(username, password, remember)
  .then(response => console.log('Logged in:', response.data.user))
  .catch(error => console.error('Login failed:', error.message));

// Verify session
API.auth.verify()
  .then(response => console.log('Authenticated:', response.data.user))
  .catch(error => console.log('Not authenticated'));

// Logout
API.auth.logout()
  .then(() => console.log('Logged out'))
  .catch(error => console.error('Logout failed:', error.message));

// Check authentication status
if (API.isAuthenticated()) {
  const user = API.getCurrentUser();
  console.log('Current user:', user);
}
```

### Error Handling

The API module throws `APIError` objects:

```javascript
try {
  await API.auth.login(username, password);
} catch (error) {
  if (error instanceof APIError) {
    console.log('Status code:', error.statusCode);
    console.log('Message:', error.message);
    console.log('Data:', error.data);
  }
}
```

## CORS Configuration

The backend is configured to accept requests from specific origins. Update `ALLOWED_ORIGINS` in `.env`:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,https://yourdomain.com
```

**Important:** Always use `credentials: 'include'` in fetch requests when working with cookies.

## Troubleshooting

### Cookie Not Being Set
- Ensure frontend and backend are on the same domain (or CORS is properly configured)
- Check that `credentials: 'include'` is set in fetch requests
- Verify `secure` flag is false in development (HTTP)

### Authentication Failing
- Check JWT_SECRET is set in `.env`
- Verify database connection is working
- Check browser console for CORS errors
- Ensure cookies are enabled in browser

### Database Connection Failed
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists (run schema.sql)

## Default Admin Account

**Username:** `admin`  
**Email:** `admin@illegalstreet.pl`  
**Password:** `Admin@123456`

**⚠️ IMPORTANT:** Change the admin password immediately after first login!

## Production Considerations

1. **Environment Variables**
   - Use strong, random JWT_SECRET
   - Set NODE_ENV=production
   - Enable secure cookies (HTTPS only)

2. **Database**
   - Use connection pooling
   - Regular backups
   - Limit user permissions

3. **Security**
   - Enable HTTPS
   - Use a reverse proxy (nginx)
   - Rate limiting per IP
   - Regular security audits
   - Monitor login attempts

4. **Performance**
   - Enable compression
   - Use CDN for static assets
   - Cache static files
   - Database query optimization

## License

ISC
