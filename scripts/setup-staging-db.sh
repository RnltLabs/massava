#!/bin/bash
# Setup PostgreSQL for Staging Environment
# Run this on the Hetzner server

set -e

echo "🔧 Setting up Staging Database on Hetzner..."

# Check if PostgreSQL container exists
if docker ps -a | grep -q massava-postgres-staging; then
  echo "✅ Staging PostgreSQL container already exists"
else
  echo "📦 Creating PostgreSQL container for staging..."

  # Generate random password
  PG_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

  # Create PostgreSQL container
  docker run -d \
    --name massava-postgres-staging \
    --restart unless-stopped \
    -e POSTGRES_USER=massava_staging \
    -e POSTGRES_PASSWORD="$PG_PASSWORD" \
    -e POSTGRES_DB=massava_staging \
    -p 5433:5432 \
    -v massava-postgres-staging-data:/var/lib/postgresql/data \
    postgres:16-alpine

  echo "✅ PostgreSQL container created"
  echo ""
  echo "📋 Save these credentials:"
  echo "DATABASE_URL=postgresql://massava_staging:${PG_PASSWORD}@localhost:5433/massava_staging"
  echo ""
  echo "⚠️  IMPORTANT: Copy this DATABASE_URL to GitHub Secrets as DATABASE_URL_STAGING"
fi

# Wait for PostgreSQL to start
echo "⏳ Waiting for PostgreSQL to start..."
sleep 5

# Check if database is ready
docker exec massava-postgres-staging pg_isready -U massava_staging || {
  echo "❌ PostgreSQL not ready. Check logs with: docker logs massava-postgres-staging"
  exit 1
}

echo "✅ Staging database is ready!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the DATABASE_URL above"
echo "2. Set GitHub secret: gh secret set DATABASE_URL_STAGING"
echo "3. Redeploy: git push origin develop"
