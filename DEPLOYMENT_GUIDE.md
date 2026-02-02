# Cookie Consent API Fix - Deployment Guide

## Issue Fixed
**Error**: `POST /api/cookie-consent/preferences` returning 404 Not Found

## Root Cause
The frontend container was using `http-server`, a simple static file server that cannot proxy API requests. When the frontend JavaScript tried to call `/api/cookie-consent/preferences`, the request was being sent to `http://localhost:8080/api/cookie-consent/preferences` instead of the backend service at `http://backend:3000/api/cookie-consent/preferences`.

## Solution
Replaced `http-server` with nginx and configured it as a reverse proxy to forward all `/api/*` requests to the backend service.

## What Was Changed

### 1. Frontend Dockerfile
- **Before**: Used `node:18-alpine` with `http-server`
- **After**: Uses `nginx:alpine` with custom nginx configuration
- **Benefit**: Nginx can act as both a static file server and a reverse proxy

### 2. Nginx Configuration (`Frontend/nginx.conf`)
- Serves static files from `/usr/share/nginx/html`
- Proxies `/api/*` requests to `http://backend:3000`
- Proxies `/socket.io/*` requests for WebSocket support
- Includes security headers and gzip compression
- Uses Docker's internal DNS resolver for dynamic hostname resolution

### 3. Docker Compose
- Updated volume mounts to match nginx's expected directories
- Ensures both frontend and backend are on the same Docker network

## Deployment Steps

### Option 1: Using Docker Compose (Recommended)

```bash
# Navigate to project root
cd Illegal-street

# Stop any running containers
docker compose down -v

# Rebuild all services
docker compose build

# Start all services
docker compose up -d

# Wait for services to be healthy
sleep 10

# Run database migrations
docker exec illegal-street-backend npx prisma migrate deploy

# (Optional) Seed the database
docker exec illegal-street-backend npm run prisma:seed

# Check logs
docker compose logs -f
```

### Option 2: Manual Build and Run

```bash
# Build frontend
cd Frontend
docker build -t illegal-street-frontend .

# Build backend
cd ../Backend
docker build -t illegal-street-backend .

# Create network
docker network create illegal-street-network

# Start PostgreSQL
docker run -d \
  --name illegal-street-db \
  --network illegal-street-network \
  -e POSTGRES_USER=illegal_street_user \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=illegal_street_db \
  -p 5432:5432 \
  postgres:15-bookworm

# Start Redis
docker run -d \
  --name illegal-street-redis \
  --network illegal-street-network \
  -p 6379:6379 \
  redis:7-alpine

# Start Backend
docker run -d \
  --name illegal-street-backend \
  --network illegal-street-network \
  -e DATABASE_URL=postgresql://illegal_street_user:your_password@illegal-street-db:5432/illegal_street_db \
  -e REDIS_URL=redis://illegal-street-redis:6379 \
  -e JWT_SECRET=your_jwt_secret \
  -e NODE_ENV=development \
  -p 3000:3000 \
  illegal-street-backend

# Wait for backend to be ready
sleep 15

# Run migrations
docker exec illegal-street-backend npx prisma migrate deploy

# Start Frontend
docker run -d \
  --name illegal-street-frontend \
  --network illegal-street-network \
  -p 8080:8080 \
  illegal-street-frontend
```

## Testing the Fix

### 1. Check Services are Running

```bash
# Check container status
docker compose ps

# All services should be "Up" and healthy
```

### 2. Test API Directly

```bash
# Test backend health endpoint directly
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":...}

# Test cookie consent API directly
curl -X GET http://localhost:3000/api/cookie-consent/policy

# Expected response: JSON with cookie policy information
```

### 3. Test Through Frontend Proxy

```bash
# Test API through nginx proxy
curl http://localhost:8080/api/cookie-consent/policy

# Expected response: Same JSON as direct backend call
# This confirms nginx is properly proxying requests
```

### 4. Test Cookie Consent POST (Frontend)

```bash
# Simulate cookie consent submission
curl -X POST http://localhost:8080/api/cookie-consent/preferences \
  -H "Content-Type: application/json" \
  -d '{"necessary":true,"functional":true,"analytics":false,"marketing":false}' \
  -c cookies.txt -b cookies.txt

# Expected response:
# {"success":true,"message":"Preferencje zapisane pomyślnie","data":{...}}

# The response should include Set-Cookie headers with:
# - cookie_consent_id
# - cookie_consent_given
```

### 5. Test in Browser

1. Open browser and navigate to `http://localhost:8080`
2. Open Browser DevTools (F12) → Network tab
3. The cookie consent banner should appear
4. Click "Zaakceptuj wszystkie" (Accept All)
5. In Network tab, verify:
   - Request to `/api/cookie-consent/preferences` returns 200 OK
   - Response includes cookies being set
   - Banner disappears after successful save

### 6. Verify Cookies

After accepting cookies in the browser:
```bash
# Check browser cookies or run:
curl -b cookies.txt http://localhost:8080/api/cookie-consent/preferences

# Should return saved preferences
```

## Common Issues and Solutions

### Issue: "host not found in upstream 'backend'"
**Cause**: Backend service not available or not on same Docker network
**Solution**: 
- Ensure backend container is running: `docker compose ps`
- Check both services are on the same network
- The updated nginx config with resolver and variables should prevent this

### Issue: 404 on API endpoints
**Cause**: Nginx not properly proxying requests
**Solution**:
- Check nginx configuration: `docker exec illegal-street-frontend nginx -t`
- Verify nginx is running: `docker compose logs frontend`
- Check network connectivity: `docker exec illegal-street-frontend ping backend`

### Issue: Database migration errors
**Cause**: Database not initialized or migrations not run
**Solution**:
```bash
# Run migrations
docker exec illegal-street-backend npx prisma migrate deploy

# If needed, generate Prisma client
docker exec illegal-street-backend npx prisma generate
```

### Issue: CORS errors
**Cause**: CORS_ORIGIN environment variable not properly set
**Solution**:
- Check `.env.docker` has: `CORS_ORIGIN=http://localhost:8080,http://localhost:3000`
- Restart backend: `docker compose restart backend`

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ http://localhost:8080
       ↓
┌──────────────────────────┐
│   Frontend (nginx)       │
│   Port: 8080             │
│   ┌───────────────────┐  │
│   │ Static Files      │  │ Serve HTML, JS, CSS
│   └───────────────────┘  │
│   ┌───────────────────┐  │
│   │ Reverse Proxy     │  │ Proxy /api/* → backend:3000
│   └───────────────────┘  │
└──────────┬───────────────┘
           │ Internal Docker Network
           ↓
┌──────────────────────────┐
│   Backend (Express)      │
│   Port: 3000             │
│   ┌───────────────────┐  │
│   │ API Endpoints     │  │ /api/cookie-consent/*
│   │ - GET /preferences│  │
│   │ - POST /preferences│ │
│   │ - GET /policy     │  │
│   └───────────────────┘  │
└──────────┬───────────────┘
           │
           ↓
┌──────────────────────────┐
│   PostgreSQL             │
│   Port: 5432             │
│   ┌───────────────────┐  │
│   │ cookie_consents   │  │ Store user preferences
│   └───────────────────┘  │
└──────────────────────────┘
```

## Files Modified

1. **Frontend/Dockerfile** - Switched from http-server to nginx
2. **Frontend/nginx.conf** - New nginx reverse proxy configuration
3. **Frontend/.dockerignore** - Exclude unnecessary files from build
4. **docker-compose.yml** - Updated volume mounts for nginx

## Verification Checklist

- [ ] Frontend container starts without errors
- [ ] Nginx configuration is valid (`docker exec illegal-street-frontend nginx -t`)
- [ ] Backend API accessible directly at `http://localhost:3000/api/cookie-consent/policy`
- [ ] API accessible through frontend proxy at `http://localhost:8080/api/cookie-consent/policy`
- [ ] Cookie consent POST request succeeds
- [ ] Cookies are properly set after consent
- [ ] Frontend UI loads correctly
- [ ] Cookie banner appears and functions correctly
- [ ] Browser console shows no errors

## Rollback Instructions

If you need to rollback these changes:

```bash
# Option 1: Revert the specific commits from this PR
# First, identify the commit hashes for this PR
git log --oneline

# Then revert them (replace with actual commit hashes)
git revert <commit-hash-3> <commit-hash-2> <commit-hash-1>

# Option 2: Reset to a specific commit (WARNING: This will lose uncommitted changes)
git reset --hard <previous-commit-hash>

# Rebuild and restart
docker compose down -v
docker compose up -d --build
```

## Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Compose Networking](https://docs.docker.com/compose/networking/)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

## Support

If you encounter issues:
1. Check container logs: `docker compose logs`
2. Verify network connectivity: `docker network inspect illegal-street-network`
3. Test each component individually using the steps above
4. Review the Common Issues section
