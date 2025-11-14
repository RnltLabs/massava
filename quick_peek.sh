#!/bin/bash
cd /Users/roman/Development/massava

# Quick peek at what exists
echo "1. Finding settings page files:"
find app/\[locale\]/business/settings -type f -name "page.tsx" 2>/dev/null

echo ""
echo "2. Finding component files in settings:"
find app/\[locale\]/business/settings -type f -name "*Client.tsx" -o -name "*Popup.tsx" 2>/dev/null | head -20

echo ""
echo "3. Checking for service-related files:"
find app -name "*Service*" -type f -name "*.tsx" 2>/dev/null | grep -v node_modules | head -10

echo ""
echo "4. Files with Sheet component usage:"
grep -l "Sheet" app/\[locale\]/business/settings/**/*.tsx 2>/dev/null | head -10
