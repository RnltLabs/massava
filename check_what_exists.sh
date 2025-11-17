#!/bin/bash
cd /Users/roman/Development/massava

echo "=== CHECKING WHAT EXISTS ==="
echo ""

echo "1. New directories from git status:"
ls -la app/\[locale\]/business/settings/ 2>/dev/null
echo ""

echo "2. Account settings:"
find app/\[locale\]/business/settings/account -type f -name "*.tsx" 2>/dev/null
echo ""

echo "3. Hours settings:"
find app/\[locale\]/business/settings/hours -type f -name "*.tsx" 2>/dev/null
echo ""

echo "4. Images settings:"
find app/\[locale\]/business/settings/images -type f -name "*.tsx" 2>/dev/null
echo ""

echo "5. Location settings:"
find app/\[locale\]/business/settings/location -type f -name "*.tsx" 2>/dev/null
echo ""

echo "6. Studio settings (if exists):"
find app/\[locale\]/business/settings/studio -type f -name "*.tsx" 2>/dev/null
echo ""

echo "7. Design spec files:"
ls -la design-spec*.md 2>/dev/null
echo ""

echo "8. Docs features:"
ls -la docs/features/ 2>/dev/null
