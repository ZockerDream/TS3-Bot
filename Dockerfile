# Multi-stage build for TS3 Music Bot

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

# Install ffmpeg for audio processing
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy backend package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy backend source
COPY src/ ./src/

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/public ./public

# Create .env file placeholder
RUN touch .env

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the bot
CMD ["node", "src/index.js"]
