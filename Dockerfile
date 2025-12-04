# Copyright (c) 2025 Roman Reinelt / RNLT Labs
# All rights reserved.

FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Build args
ARG GIT_COMMIT=unknown
ARG NEXT_PUBLIC_VERCEL_ENV=production
ARG DATABASE_URL
ARG RESEND_API_KEY

# Echo build info
RUN echo "Building commit: $GIT_COMMIT"
RUN echo "Environment: $NEXT_PUBLIC_VERCEL_ENV"

# Set environment variables for build
ENV NEXT_PUBLIC_VERCEL_ENV=$NEXT_PUBLIC_VERCEL_ENV
ENV DATABASE_URL=$DATABASE_URL
ENV RESEND_API_KEY=$RESEND_API_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
# Set production env for Sentry (must be set at build time!)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install Prisma CLI and tsx for database migrations and seeding
# This is needed to run migrations and seed scripts in production environment
RUN npm install -g prisma@6.17.1 tsx@4.19.2

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/app/generated ./app/generated

# Copy Prisma schema and migrations for database operations
# This allows running migrations in production using the same image
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy package.json and node_modules for seed scripts
# This is needed to run seed scripts that depend on project dependencies
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run the Next.js server
CMD ["node", "server.js"]
