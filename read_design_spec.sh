#!/bin/bash
cd /Users/roman/Development/massava

echo "=== READING EXISTING DESIGN SPEC ==="
cat design-spec-service-card.md 2>/dev/null || echo "Not found"

echo ""
echo "=== READING UX ANALYSIS ==="
cat ux-analysis-services-page-mobile.md 2>/dev/null || echo "Not found"

echo ""
echo "=== READING LOCATION IMPLEMENTATION ==="
cat LOCATION_SETTINGS_IMPLEMENTATION.md 2>/dev/null || echo "Not found"
