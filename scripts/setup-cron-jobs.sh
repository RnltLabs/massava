#!/bin/bash
# Copyright (c) 2025 Roman Reinelt / RNLT Labs
# Setup Cron Jobs for Massava Email Notifications
#
# This script sets up system crontab on your production server
# to trigger the email notification cron jobs.
#
# Usage:
#   1. Copy this script to your production server
#   2. Set the CRON_SECRET environment variable
#   3. Run: bash setup-cron-jobs.sh
#
# Requirements:
#   - curl installed
#   - Massava app running on localhost:3004
#   - CRON_SECRET environment variable set

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Massava Cron Jobs Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
    echo -e "${RED}❌ ERROR: CRON_SECRET environment variable is not set${NC}"
    echo ""
    echo "Please set it with:"
    echo "  export CRON_SECRET='your-cron-secret-here'"
    echo ""
    echo "Or add it to your ~/.bashrc:"
    echo "  echo 'export CRON_SECRET=\"your-cron-secret-here\"' >> ~/.bashrc"
    echo "  source ~/.bashrc"
    exit 1
fi

echo -e "${GREEN}✅ CRON_SECRET is set${NC}"
echo ""

# Application URL
APP_URL="${APP_URL:-http://localhost:3004}"
echo -e "${YELLOW}Using APP_URL: $APP_URL${NC}"
echo ""

# Create temporary crontab file
TEMP_CRON=$(mktemp)

# Get existing crontab (if any)
crontab -l > "$TEMP_CRON" 2>/dev/null || echo "# Massava Cron Jobs" > "$TEMP_CRON"

# Remove old Massava cron jobs (if any)
sed -i '/# Massava Email Notifications/d' "$TEMP_CRON"
sed -i '/api\/cron\/booking-reminders/d' "$TEMP_CRON"
sed -i '/api\/cron\/review-requests/d' "$TEMP_CRON"
sed -i '/api\/cron\/data-retention/d' "$TEMP_CRON"

# Add new Massava cron jobs
cat >> "$TEMP_CRON" << EOF

# Massava Email Notifications - Auto-generated on $(date)
# Data Retention (2:00 AM UTC daily)
0 2 * * * curl -s -X GET "$APP_URL/api/cron/data-retention" -H "Authorization: Bearer $CRON_SECRET" >/dev/null 2>&1

# Booking Reminders (10:00 AM UTC daily)
0 10 * * * curl -s -X GET "$APP_URL/api/cron/booking-reminders" -H "Authorization: Bearer $CRON_SECRET" >/dev/null 2>&1

# Review Requests (11:00 AM UTC daily)
0 11 * * * curl -s -X GET "$APP_URL/api/cron/review-requests" -H "Authorization: Bearer $CRON_SECRET" >/dev/null 2>&1
EOF

# Install new crontab
crontab "$TEMP_CRON"

# Cleanup
rm "$TEMP_CRON"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Cron jobs installed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Installed cron jobs:"
echo ""
echo "  • Data Retention:    Daily at 02:00 UTC"
echo "  • Booking Reminders: Daily at 10:00 UTC"
echo "  • Review Requests:   Daily at 11:00 UTC"
echo ""
echo "Current crontab:"
crontab -l | grep -A 10 "Massava Email Notifications"
echo ""
echo -e "${YELLOW}📝 Note: Make sure CRON_SECRET is set in your environment${NC}"
echo -e "${YELLOW}   Add to ~/.bashrc for persistence:${NC}"
echo -e "${YELLOW}   export CRON_SECRET=\"$CRON_SECRET\"${NC}"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
