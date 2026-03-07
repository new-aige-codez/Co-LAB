FROM node:20-alpine

WORKDIR /app

# Install git for workspace operations
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./
COPY web/package*.json ./web/

# Install dependencies
RUN npm ci --only=production
RUN cd web && npm ci --only=production

# Copy source code
COPY . .

# Build server
RUN npm run build:server

# Build web frontend
RUN cd web && npm run build

# Create data directory
RUN mkdir -p /data

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production
ENV DATA_DIR=/data

# Start server
CMD ["node", "dist/index.js"]
