# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache netcat-openbsd curl

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client and build the application
RUN npx prisma generate && npm run build

# Make scripts executable
RUN chmod +x scripts/init-db.js scripts/railway-deploy.js scripts/diagnose-db.js scripts/test-db-connection.js scripts/get-table-stats.js scripts/start-production.js scripts/postbuild.js

# Remove dev dependencies to reduce image size
RUN npm prune --production && npm cache clean --force

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose the port that Railway will assign
EXPOSE $PORT

# Add health check - very tolerant for database startup issues
HEALTHCHECK --interval=30s --timeout=15s --start-period=300s --retries=10 \
    CMD curl -f http://localhost:$PORT/api/health || exit 1

# Start the application with Railway-optimized deployment
CMD ["sh", "-c", "node scripts/railway-deploy.js && npm start"]
