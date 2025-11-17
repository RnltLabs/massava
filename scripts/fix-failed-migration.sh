#!/bin/bash
# Fix failed migration on staging server
# This script resolves the failed 20251117_add_cron_performance_indexes migration

set -e

echo "🔧 Fixing failed migration on staging database..."

# Check current migration status
echo "📊 Current migration status:"
docker run --rm \
  --network host \
  -e DATABASE_URL="$DATABASE_URL" \
  ghcr.io/rnltlabs/massava:staging \
  sh -c "npx prisma migrate status || true"

echo ""
echo "🗑️  Marking failed migration as rolled back..."

# Mark the old migration as rolled back
docker run --rm \
  --network host \
  -e DATABASE_URL="$DATABASE_URL" \
  ghcr.io/rnltlabs/massava:staging \
  sh -c "npx prisma migrate resolve --rolled-back 20251117_add_cron_performance_indexes"

echo ""
echo "✅ Failed migration marked as rolled back"

echo ""
echo "🔄 Running migrations again..."

# Run migrations again (the renamed one will now run)
docker run --rm \
  --network host \
  -e DATABASE_URL="$DATABASE_URL" \
  ghcr.io/rnltlabs/massava:staging \
  sh -c "npx prisma migrate deploy"

echo ""
echo "✅ Migrations completed successfully!"

echo ""
echo "📊 Final migration status:"
docker run --rm \
  --network host \
  -e DATABASE_URL="$DATABASE_URL" \
  ghcr.io/rnltlabs/massava:staging \
  sh -c "npx prisma migrate status"
