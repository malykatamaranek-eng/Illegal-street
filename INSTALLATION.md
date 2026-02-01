# 🚀 Illegal Street - Docker Installation Guide

Complete guide for setting up and running the Illegal Street application using Docker.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (v20.10 or higher) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (v2.0 or higher) - [Install Docker Compose](https://docs.docker.com/compose/install/)
- **Git** - For cloning the repository

### Verify Installation

```bash
docker --version
docker-compose --version
```

---

## 🛠️ Quick Start (5 Minutes)

### Step 1: Clone the Repository

```bash
git clone https://github.com/malykatamaranek-eng/Illegal-street.git
cd Illegal-street
```

### Step 2: Configure Environment Variables

The `.env.docker` file contains default configuration. For production, update these values:

```bash
# View the default configuration
cat .env.docker

# (Optional) Copy and customize for production
cp .env.docker .env.production
nano .env.production
```

**Important:** Change these values in production:
- `POSTGRES_PASSWORD` - Strong database password
- `JWT_SECRET` - Cryptographically secure random string (min 32 chars)
- `JWT_REFRESH_SECRET` - Different from JWT_SECRET
- `ENCRYPTION_KEY` - Exactly 32 characters for encryption

### Step 3: Build and Start All Services

```bash
# Build and start all containers in detached mode
docker-compose up -d --build
```

This will start:
- ✅ PostgreSQL database (port 5432)
- ✅ Redis cache (port 6379)
- ✅ Backend API (port 3000)
- ✅ Frontend web server (port 8080)

### Step 4: Run Database Migrations and Seed

```bash
# Run Prisma migrations
docker exec illegal-street-backend npx prisma migrate deploy

# Seed the database with initial data (3 admin users)
docker exec illegal-street-backend npm run prisma:seed
```

### Step 5: Verify Everything is Running

```bash
# Check all services are healthy
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 6: Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health

---

## 👥 Default Admin Accounts

After seeding, you can login with these accounts:

| Email | Password | Role |
|-------|----------|------|
| vitalik@illegal-street.io | V1t@l1k_Secure#2024! | SUPER_ADMIN |
| developer@illegal-street.io | Dev3l0per_Safe@456! | ADMIN |
| blazej@illegal-street.io | Bl@zej_Fortress#789! | ADMIN |

**⚠️ IMPORTANT:** Change these passwords immediately after first login in production!

---

## 🔧 Common Commands

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend
docker-compose up -d frontend
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Rebuild Services

```bash
# Rebuild all services
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
```

### Database Management

```bash
# Access PostgreSQL shell
docker exec -it illegal-street-db psql -U illegal_street_user -d illegal_street_db

# Run Prisma Studio (Database GUI)
docker exec -it illegal-street-backend npx prisma studio

# Create new migration
docker exec -it illegal-street-backend npx prisma migrate dev --name your_migration_name

# Reset database (⚠️ deletes all data)
docker exec -it illegal-street-backend npx prisma migrate reset
```

### Backend Shell Access

```bash
# Access backend container shell
docker exec -it illegal-street-backend sh

# Run backend commands
docker exec illegal-street-backend npm run build
docker exec illegal-street-backend npm run test
```

### Redis Management

```bash
# Access Redis CLI
docker exec -it illegal-street-redis redis-cli

# Check Redis info
docker exec illegal-street-redis redis-cli INFO

# Flush Redis cache (⚠️ clears all cache)
docker exec illegal-street-redis redis-cli FLUSHALL
```

---

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check service status
docker-compose ps

# View error logs
docker-compose logs

# Check specific service logs
docker-compose logs backend
docker-compose logs postgres
```

### Database Connection Issues

```bash
# Verify postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Test database connection
docker exec illegal-street-backend npx prisma db push
```

### Port Already in Use

If you get "port already in use" errors, change the ports in `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "3001:3000"  # Change 3000 to 3001
  
  frontend:
    ports:
      - "8081:8080"  # Change 8080 to 8081
```

### Container Keeps Restarting

```bash
# Check container logs for errors
docker logs illegal-street-backend

# Check health status
docker inspect illegal-street-backend | grep -A 10 Health
```

### Clean Restart

If you encounter persistent issues, try a clean restart:

```bash
# Stop all services
docker-compose down -v

# Remove all containers and images
docker system prune -a

# Rebuild from scratch
docker-compose up -d --build

# Re-run migrations and seed
docker exec illegal-street-backend npx prisma migrate deploy
docker exec illegal-street-backend npm run prisma:seed
```

---

## 🔒 Security Considerations

### Production Deployment

1. **Change Default Passwords**
   ```bash
   # Update .env.docker with strong passwords
   POSTGRES_PASSWORD=<strong-random-password>
   JWT_SECRET=<cryptographically-secure-32+-char-string>
   ```

2. **Use Environment-Specific Files**
   ```bash
   # Create production config
   cp .env.docker .env.production
   
   # Use production config
   docker-compose --env-file .env.production up -d
   ```

3. **Enable HTTPS**
   - Use a reverse proxy (nginx, Traefik, Caddy)
   - Configure SSL certificates
   - Update CORS_ORIGIN in environment

4. **Restrict Database Access**
   ```yaml
   # In docker-compose.yml, remove external port exposure
   postgres:
     # Remove or comment out:
     # ports:
     #   - "5432:5432"
   ```

5. **Regular Backups**
   ```bash
   # Backup database
   docker exec illegal-street-db pg_dump -U illegal_street_user illegal_street_db > backup.sql
   
   # Restore database
   docker exec -i illegal-street-db psql -U illegal_street_user illegal_street_db < backup.sql
   ```

---

## 📊 Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# Check all services
docker-compose ps
```

### Resource Usage

```bash
# View container resource usage
docker stats

# View specific container stats
docker stats illegal-street-backend
```

---

## 🔄 Updates and Maintenance

### Update Application Code

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Run new migrations if any
docker exec illegal-street-backend npx prisma migrate deploy
```

### Update Dependencies

```bash
# Update backend dependencies
docker exec illegal-street-backend npm update

# Rebuild
docker-compose up -d --build backend
```

---

## 📝 Additional Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **Docker Documentation**: https://docs.docker.com
- **Express.js Documentation**: https://expressjs.com
- **Socket.io Documentation**: https://socket.io/docs

---

## 🆘 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify all services are healthy: `docker-compose ps`
3. Check the [GitHub Issues](https://github.com/malykatamaranek-eng/Illegal-street/issues)
4. Contact the development team

---

## 📜 License

This project is licensed under the ISC License.

---

**Happy Coding! 🎉**
