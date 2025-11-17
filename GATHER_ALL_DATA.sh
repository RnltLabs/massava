#!/bin/bash
# Master data gathering script
# Run this to collect all popup code into one output file

cd /Users/roman/Development/massava

OUTPUT="COMPLETE_POPUP_DATA.md"

exec > "$OUTPUT" 2>&1

echo "# Complete Popup Analysis Data"
echo "Generated: $(date)"
echo ""

# Step 1: Find reference files
echo "## Step 1: Reference File Search"
echo ""
echo "### Files containing 'side=\"bottom\"':"
grep -r 'side="bottom"' app --include="*.tsx" -l 2>/dev/null || echo "NONE FOUND"
echo ""

# Step 2: Read first reference file
echo "## Step 2: Reference Popup Code"
echo ""
REF=$(grep -r 'side="bottom"' app --include="*.tsx" -l 2>/dev/null | head -1)
if [ -n "$REF" ]; then
  echo "### Reference File: $REF"
  echo ""
  echo '```typescript'
  cat "$REF"
  echo '```'
else
  echo "NO REFERENCE FOUND"
fi
echo ""

# Step 3: Read Sheet component
echo "## Step 3: shadcn/ui Sheet Component"
echo ""
if [ -f "components/ui/sheet.tsx" ]; then
  echo '```typescript'
  cat "components/ui/sheet.tsx"
  echo '```'
else
  echo "NOT FOUND"
fi
echo ""

# Step 4-10: Read all new popups
declare -a STUDIO_POPUPS=("BasicInfoPopup" "LocationPopup" "OpeningHoursPopup" "ImagesPopup")
declare -a ACCOUNT_POPUPS=("NotificationsPopup" "PrivacyPopup" "DangerZonePopup")

echo "## Step 4: Studio Settings Popups"
echo ""
for popup in "${STUDIO_POPUPS[@]}"; do
  FILE="app/[locale]/business/settings/studio/_components/${popup}.tsx"
  echo "### $popup"
  echo ""
  if [ -f "$FILE" ]; then
    echo '```typescript'
    cat "$FILE"
    echo '```'
  else
    echo "FILE NOT FOUND: $FILE"
  fi
  echo ""
done

echo "## Step 5: Account Settings Popups"
echo ""
for popup in "${ACCOUNT_POPUPS[@]}"; do
  FILE="app/[locale]/business/settings/account/_components/${popup}.tsx"
  echo "### $popup"
  echo ""
  if [ -f "$FILE" ]; then
    echo '```typescript'
    cat "$FILE"
    echo '```'
  else
    echo "FILE NOT FOUND: $FILE"
  fi
  echo ""
done

echo "## Step 6: Directory Listings"
echo ""
echo "### Studio Settings Components:"
echo '```'
ls -la "app/[locale]/business/settings/studio/_components/" 2>/dev/null || echo "NOT FOUND"
echo '```'
echo ""
echo "### Account Settings Components:"
echo '```'
ls -la "app/[locale]/business/settings/account/_components/" 2>/dev/null || echo "NOT FOUND"
echo '```'
echo ""

echo "---"
echo "END OF DATA COLLECTION"

# Make the script executable and run it
chmod +x "$0"
