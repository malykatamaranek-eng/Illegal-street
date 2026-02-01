# ===================================
# ILLEGAL STREET BACKEND - DOCKERFILE
# Development and Production builds
# ===================================

FROM node:18-alpine

WORKDIR /app/backend

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
