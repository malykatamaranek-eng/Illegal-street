# Illegal Street - Secure Backend API

## 🔒 Security Features

This backend implements comprehensive security measures to protect against various attack vectors:

### 1. **HTTP Security Headers**
- ✅ Helmet.js for setting secure HTTP headers
- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options (Clickjacking protection)
- ✅ X-XSS-Protection
- ✅ X-Content-Type-Options
- ✅ Strict-Transport-Security (HSTS)
- ✅ Referrer Policy

### 2. **SQL Injection Protection**
- ✅ Parameterized queries using prepared statements
- ✅ Input sanitization and validation
- ✅ No dynamic SQL query construction
- ✅ Multiple statements disabled
- ✅ Identifier validation for table/column names

### 3. **XSS (Cross-Site Scripting) Protection**
- ✅ xss-clean middleware
- ✅ Input sanitization
- ✅ Output encoding
- ✅ Content Security Policy

### 4. **CSRF (Cross-Site Request Forgery) Protection**
- ✅ SameSite cookie attribute
- ✅ CSRF token validation
- ✅ Origin validation

### 5. **Cookie Security**
- ✅ HttpOnly flag (prevents JavaScript access)
- ✅ Secure flag (HTTPS only)
- ✅ SameSite attribute (CSRF protection)
- ✅ Proper expiration times
- ✅ GDPR-compliant cookie consent

### 6. **Rate Limiting**
- ✅ Global rate limiting (100 requests per 15 minutes)
- ✅ Strict authentication rate limiting (5 attempts per 15 minutes)
- ✅ Account lockout after failed login attempts
- ✅ IP-based tracking

### 7. **Authentication & Authorization**
- ✅ JWT tokens with secure secret
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Password strength requirements
- ✅ Failed login attempt tracking
- ✅ Automatic account lockout
- ✅ Secure password reset mechanism
- ✅ Role-based access control (RBAC)

### 8. **Data Protection**
- ✅ Input validation using express-validator
- ✅ NoSQL injection prevention
- ✅ HPP (HTTP Parameter Pollution) prevention
- ✅ Request size limiting
- ✅ Data sanitization

### 9. **Logging & Monitoring**
- ✅ Login attempt logging
- ✅ Security event logging
- ✅ IP address tracking
- ✅ User agent tracking
- ✅ Failed authentication alerts

### 10. **CORS Protection**
- ✅ Whitelist-based origin validation
- ✅ Credentials support with strict origin checking
- ✅ Preflight request handling

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

## 🚀 Installation

1. **Install dependencies:**
   ```bash
   cd Backend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and update the following:
   - Database credentials
   - JWT secret (minimum 32 characters)
   - Session secret
   - CSRF secret
   - Allowed origins
   - Email configuration (optional)

3. **Set up database:**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

4. **Start the server:**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 🗄️ Database Schema

The database includes the following tables:

- **users** - User accounts with authentication data
- **login_logs** - Audit trail of login attempts
- **cookie_consents** - GDPR-compliant cookie preferences
- **sessions** - Session management
- **security_events** - Security event logging

## 🔑 API Endpoints

### Authentication

#### POST `/api/auth/login`
Login with username/email and password.

**Request:**
```json
{
  "username": "user@example.com",
  "password": "SecurePass123!",
  "remember": false
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Zalogowano pomyślnie",
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
Logout current user.

#### POST `/api/auth/register`
Register new user (admin only).

**Request:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "role": "user"
}
```

#### POST `/api/auth/forgot-password`
Request password reset.

#### POST `/api/auth/reset-password/:token`
Reset password with token.

#### GET `/api/auth/me`
Get current user (requires authentication).

#### POST `/api/auth/refresh-token`
Refresh JWT token.

### User Management

#### GET `/api/users/profile`
Get user profile (requires authentication).

#### PUT `/api/users/profile`
Update user profile (requires authentication).

#### PUT `/api/users/change-password`
Change password (requires authentication).

#### DELETE `/api/users/account`
Delete account (requires authentication).

### Cookie Consent

#### GET `/api/cookie-consent/preferences`
Get cookie preferences.

#### POST `/api/cookie-consent/preferences`
Save cookie preferences.

**Request:**
```json
{
  "necessary": true,
  "functional": true,
  "analytics": false,
  "marketing": false
}
```

#### GET `/api/cookie-consent/policy`
Get cookie policy details.

### Health Check

#### GET `/api/health`
Check server status.

## 🛡️ Security Best Practices

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (@$!%*?&)

### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Failed logins: Account locked for 15 minutes after 5 attempts

### Cookie Configuration
- HttpOnly: Prevents XSS attacks
- Secure: HTTPS only in production
- SameSite: Strict (CSRF protection)
- Expiration: 7 days for auth tokens

### SQL Injection Prevention
Always use parameterized queries:
```javascript
// ✅ GOOD - Parameterized query
await db.query('SELECT * FROM users WHERE id = ?', [userId]);

// ❌ BAD - String concatenation
await db.query(`SELECT * FROM users WHERE id = ${userId}`);
```

### Input Validation
All inputs are validated using express-validator:
```javascript
body('email')
  .trim()
  .isEmail()
  .normalizeEmail()
```

## 🔧 Configuration

### Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_USER=illegal_street_user
DB_PASSWORD=secure_password
DB_NAME=illegal_street_db
DB_PORT=3306

# JWT
JWT_SECRET=your_secure_32_char_secret
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=15

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 📊 Monitoring & Logging

The backend logs the following security events:

1. **Failed login attempts** - IP, username, timestamp
2. **Account lockouts** - User ID, reason, duration
3. **Suspicious activities** - Unusual patterns, multiple IPs
4. **Password resets** - User ID, IP, timestamp
5. **Account deletions** - User ID, timestamp

## 🚨 Security Incident Response

If you detect a security issue:

1. Review `login_logs` table for suspicious activity
2. Check `security_events` table for logged incidents
3. Identify compromised accounts in `users` table
4. Lock affected accounts immediately
5. Rotate JWT secrets if necessary
6. Review and update rate limits

## 📝 Default Credentials

**Admin Account:**
- Username: `admin`
- Email: `admin@illegalstreet.pl`
- Password: `Admin@123456`

**⚠️ IMPORTANT: Change the default admin password immediately after setup!**

## 🔄 Maintenance

### Clean up expired sessions
```sql
DELETE FROM sessions WHERE expires_at < NOW();
```

### Clean up old login logs (keep last 90 days)
```sql
DELETE FROM login_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### Backup database
```bash
mysqldump -u root -p illegal_street_db > backup_$(date +%Y%m%d).sql
```

## 📄 License

© 2024 Illegal Street. All rights reserved.
