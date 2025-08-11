# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
# Copy package manifests (lockfile if present) to leverage Docker layer caching
COPY package*.json ./
# Prefer reproducible installs when lockfile exists, otherwise fallback with faster flags
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install --production=false --no-audit --progress=false; \
    fi

FROM node:20-alpine AS builder
WORKDIR /app
# Build-time public env for Next.js client bundle
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
ARG NEXT_PUBLIC_API_BASE_URL=""
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Copy Next.js standalone server and assets at expected paths
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
