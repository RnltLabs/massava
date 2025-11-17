#!/bin/bash

# Script to migrate console.log/error to structured logging
# Phase 2: Code Quality - Structured Logging

set -e

echo "Migrating console statements to structured logging..."

# List of files to migrate (critical files first)
FILES=(
  "lib/auth/background-sync.ts"
  "lib/auth/optimized-nextauth.config.ts"
  "lib/auth/session-cache.ts"
  "lib/auth/refresh-token.ts"
  "lib/auth/edge-session-validator.ts"
  "lib/auth/dal.ts"
  "lib/cron/data-retention-job.ts"
  "lib/rate-limit.ts"
  "lib/audit.ts"
  "lib/prisma.ts"
  "auth.ts"
  "app/actions/createBooking.ts"
  "app/actions/studio/registerStudio.ts"
  "app/actions/studio/updateStudio.ts"
  "app/api/business/bookings/route.ts"
  "app/api/business/calendar/route.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Add logger import if not exists
    if ! grep -q "from ['\"]@/lib/logger['\"]" "$file"; then
      # Find the last import line
      last_import=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
      if [ -n "$last_import" ]; then
        sed -i '' "${last_import}a\\
import { logger } from '@/lib/logger';
" "$file"
      fi
    fi

    # Replace console.error with logger.error
    sed -i '' \
      -e 's/console\.error(\([^,)]*\), \(.*\));/logger.error(\1, { error: \2 as Error });/g' \
      -e 's/console\.error(\([^)]*\));/logger.error(\1);/g' \
      "$file"

    # Replace console.warn with logger.warn
    sed -i '' \
      -e 's/console\.warn(\([^)]*\));/logger.warn(\1);/g' \
      "$file"

    # Replace console.log with logger.info
    sed -i '' \
      -e 's/console\.log(\([^)]*\));/logger.info(\1);/g' \
      "$file"

    # Replace console.debug with logger.debug
    sed -i '' \
      -e 's/console\.debug(\([^)]*\));/logger.debug(\1);/g' \
      "$file"

    # Remove [INFO], [ERROR], [WARN] prefixes since logger adds them
    sed -i '' \
      -e 's/\[INFO\] //g' \
      -e 's/\[ERROR\] //g' \
      -e 's/\[WARN\] //g' \
      -e 's/\[PERF\] //g' \
      "$file"

    echo "✓ $file migrated"
  else
    echo "⚠ $file not found, skipping"
  fi
done

echo ""
echo "Migration complete!"
echo ""
echo "Remaining console statements:"
grep -r "console\.\(log\|error\|warn\|info\|debug\)" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git . | wc -l
