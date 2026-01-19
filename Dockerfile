# Multi-stage build for Next.js standalone
FROM node:20-alpine AS builder

# Use China mirror for Alpine
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# Use China mirror for npm
RUN npm config set registry https://registry.npmmirror.com

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build Next.js in standalone mode
RUN npm run build

# Production stage with Node.js
FROM node:20-alpine AS runner

# Use China mirror for Alpine
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Start Next.js server
CMD ["node", "server.js"]
