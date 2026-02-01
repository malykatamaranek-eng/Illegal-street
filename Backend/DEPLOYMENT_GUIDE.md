# Deployment Guide - Illegal Street

Complete guide for deploying the Illegal Street application to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Production Checklist](#production-checklist)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **Redis**: 7.x or higher
- **npm**: 9.x or higher
- **Docker** (optional): 20.x or higher
- **Git**: For version control

### Required Services

- **PostgreSQL Database**: For main data storage
- **Redis Server**: For caching and job queues
- **SMTP Server**: For sending emails
- **AWS S3** (optional): For file storage
- **Sentry** (optional): For error tracking

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/malykatamaranek-eng/Illegal-street.git
cd Illegal-street
```

### 2. Backend Environment Variables

Create `.env` file in the Backend directory:

```bash
cd Backend
cp .env.example .env
```

Edit `.env` with your production values:

```env
# Application
NODE_ENV=production
PORT=5000
API_VERSION=v1
APP_URL=https://your-domain.com
FRONTEND_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/illegal_street
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=illegal_street
DB_USER=your_db_user
DB_PASSWORD=your_strong_db_password

# Redis
REDIS_URL=redis://your-redis-host:6379
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT Secrets (Generate strong random strings)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_minimum_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://your-domain.com

# E2E Encryption
E2E_PUBLIC_KEY=your_public_key
E2E_PRIVATE_KEY=your_private_key

# AWS S3 (if using)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-central-1
S3_BUCKET=your-bucket-name

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@your-domain.com

# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production

# Logging
LOG_LEVEL=info
LOG_DIR=logs
LOG_FORMAT=json

# WebSocket
WEBSOCKET_PATH=/socket.io
WEBSOCKET_CORS_ORIGIN=https://your-domain.com

# Bull Queue
QUEUE_REDIS_HOST=your-redis-host
QUEUE_REDIS_PORT=6379
QUEUE_REDIS_PASSWORD=your_redis_password

# File Upload
UPLOAD_DIR=uploads
UPLOAD_MAX_SIZE=10485760
```

### 3. Generate Secure Keys

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate E2E encryption keys (using libsodium)
npm install libsodium-wrappers
node -e "const sodium = require('libsodium-wrappers'); sodium.ready.then(() => { const keys = sodium.crypto_box_keypair(); console.log('Public:', Buffer.from(keys.publicKey).toString('hex')); console.log('Private:', Buffer.from(keys.privateKey).toString('hex')); });"
```

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE illegal_street;

# Create user
CREATE USER illegal_street_user WITH PASSWORD 'your_strong_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE illegal_street TO illegal_street_user;

# Exit
\q
```

### 2. Run Migrations

```bash
cd Backend
npm install
npx prisma generate
npx prisma migrate deploy
```

### 3. Seed Database

```bash
npm run prisma:seed
```

This will create 3 admin users:
- `vitalik@illegal-street.io` / `V1t@l1k_Secure#2024!` (SUPER_ADMIN)
- `developer@illegal-street.io` / `Dev3l0per_Safe@456!` (ADMIN)
- `blazej@illegal-street.io` / `Bl@zej_Fortress#789!` (ADMIN)

---

## Backend Deployment

### Option 1: Node.js Direct Deployment

```bash
cd Backend

# Install production dependencies
npm ci --production

# Build TypeScript
npm run build

# Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/server.js --name illegal-street-api -i max

# Or start directly
npm start
```

### Option 2: Using PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'illegal-street-api',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
};
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### PM2 Commands

```bash
# Status
pm2 status

# Logs
pm2 logs illegal-street-api

# Restart
pm2 restart illegal-street-api

# Stop
pm2 stop illegal-street-api

# Monitor
pm2 monit
```

---

## Frontend Deployment

### Option 1: Static File Hosting (Nginx)

```bash
cd Frontend

# Copy files to web root
sudo cp -r * /var/www/illegal-street/

# Update API endpoint in JavaScript files
# Edit api.js or config file to point to production backend
```

Create Nginx configuration (`/etc/nginx/sites-available/illegal-street`):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Root directory
    root /var/www/illegal-street;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket proxy
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/illegal-street /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: CDN Deployment

For optimal performance, deploy frontend to a CDN:

1. **Cloudflare Pages**
2. **Netlify**
3. **Vercel**
4. **AWS CloudFront + S3**

---

## Docker Deployment

### Build and Run with Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Compose File

The existing `docker-compose.yml` includes:
- PostgreSQL database
- Redis cache
- Backend API server

### Custom Docker Deployment

```bash
# Build backend image
cd Backend
docker build -t illegal-street-backend:latest .

# Run backend container
docker run -d \
  --name illegal-street-api \
  -p 5000:5000 \
  --env-file .env \
  illegal-street-backend:latest

# Build and run with networks
docker network create illegal-street-network
docker run -d --name postgres --network illegal-street-network postgres:15
docker run -d --name redis --network illegal-street-network redis:7
docker run -d --name api --network illegal-street-network -p 5000:5000 illegal-street-backend:latest
```

---

## Production Checklist

### Security

- [ ] All environment variables set with strong values
- [ ] JWT secrets are random and at least 32 characters
- [ ] Database passwords are strong and unique
- [ ] Redis password is set
- [ ] CORS origins are properly configured
- [ ] Rate limiting is enabled
- [ ] HTTPS/SSL certificates are installed
- [ ] Security headers are configured
- [ ] File upload restrictions are in place
- [ ] Admin credentials are changed from defaults

### Performance

- [ ] Database indexes are created
- [ ] Redis caching is configured
- [ ] Gzip compression is enabled
- [ ] Static assets are cached
- [ ] PM2 cluster mode is enabled
- [ ] Database connection pooling is configured

### Monitoring

- [ ] Sentry error tracking is configured
- [ ] Winston logging is enabled
- [ ] PM2 monitoring is set up
- [ ] Database backups are scheduled
- [ ] Uptime monitoring is configured
- [ ] Log rotation is set up

### Testing

- [ ] All endpoints are accessible
- [ ] Authentication works correctly
- [ ] WebSocket connections work
- [ ] File uploads work
- [ ] Email sending works
- [ ] Database migrations ran successfully
- [ ] Admin users can log in

---

## Monitoring & Maintenance

### Health Check Endpoint

```bash
curl https://your-domain.com/api/health
```

### Logs

```bash
# PM2 logs
pm2 logs illegal-street-api

# Application logs
tail -f Backend/logs/combined.log
tail -f Backend/logs/error.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Backups

```bash
# Manual backup
pg_dump -U illegal_street_user illegal_street > backup_$(date +%Y%m%d).sql

# Restore
psql -U illegal_street_user illegal_street < backup_20240101.sql

# Automated daily backups (crontab)
0 2 * * * pg_dump -U illegal_street_user illegal_street > /backups/db_$(date +\%Y\%m\%d).sql
```

### Redis Persistence

Ensure Redis persistence is configured in `redis.conf`:

```conf
save 900 1
save 300 10
save 60 10000
```

### Updates and Maintenance

```bash
# Pull latest code
git pull origin main

# Backend updates
cd Backend
npm install
npm run build
pm2 restart illegal-street-api

# Database migrations
npx prisma migrate deploy

# Frontend updates
cd Frontend
# Copy updated files to web root
sudo cp -r * /var/www/illegal-street/
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
pm2 logs illegal-street-api

# Common issues:
# 1. Port already in use
sudo lsof -i :5000

# 2. Database connection failed
psql -U illegal_street_user -d illegal_street

# 3. Missing environment variables
cat Backend/.env
```

### Database Connection Issues

```bash
# Test database connection
psql -U illegal_street_user -h localhost -d illegal_street

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli -h localhost -p 6379 -a your_password ping

# Check Redis status
sudo systemctl status redis

# Restart Redis
sudo systemctl restart redis
```

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Restart with memory limit
pm2 restart illegal-street-api --max-memory-restart 1G

# Clear Redis cache
redis-cli FLUSHALL
```

### Slow Performance

1. Check database queries (enable slow query log)
2. Monitor Redis hit rate
3. Check network latency
4. Review application logs for bottlenecks
5. Enable database query optimization

### SSL Certificate Issues

```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Test certificate
sudo certbot certificates

# Restart Nginx
sudo systemctl restart nginx
```

---

## Support

For issues and questions:
- Check the [README](./README.md)
- Review [API Documentation](./API_DOCUMENTATION.md)
- Check application logs
- Contact development team

---

## License

Copyright © 2024 Illegal Street Team. All rights reserved.
