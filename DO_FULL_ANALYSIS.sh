#!/bin/bash
set -e

cd /Users/roman/Development/massava

# Output file
OUT="FINAL_POPUP_ANALYSIS.md"

{
cat << 'EOF'
# Popup Styling Analysis - Complete Report

Generated: $(date)

---

## PART 1: Finding Reference Implementation

### Search for files with side="bottom"
EOF

echo "**Command**: \`grep -r 'side=\"bottom\"' app --include=\"*.tsx\" -l\`"
echo ""
echo "**Results**:"
echo '```'
grep -r 'side="bottom"' app --include="*.tsx" -l 2>/dev/null || echo "NO FILES FOUND"
echo '```'
echo ""

echo "### First Reference File Content"
echo ""
REF_FILE=$(grep -r 'side="bottom"' app --include="*.tsx" -l 2>/dev/null | head -1)
if [ -n "$REF_FILE" ]; then
  echo "**File**: \`$REF_FILE\`"
  echo ""
  echo '```typescript'
  cat "$REF_FILE" 2>/dev/null
  echo '```'
else
  echo "NO REFERENCE FILE FOUND"
fi
echo ""

cat << 'EOF'

---

## PART 2: shadcn/ui Sheet Component

EOF

if [ -f "components/ui/sheet.tsx" ]; then
  echo '```typescript'
  cat "components/ui/sheet.tsx"
  echo '```'
else
  echo "**NOT FOUND**: components/ui/sheet.tsx"
fi
echo ""

cat << 'EOF'

---

## PART 3: New Popup Files

### Checking Studio Settings Popups

EOF

for popup in BasicInfoPopup LocationPopup OpeningHoursPopup ImagesPopup; do
  FILE="app/[locale]/business/settings/studio/_components/${popup}.tsx"
  echo "#### ${popup}.tsx"
  echo ""
  if [ -f "$FILE" ]; then
    echo '```typescript'
    cat "$FILE"
    echo '```'
  else
    echo "**FILE NOT FOUND**: $FILE"
  fi
  echo ""
done

cat << 'EOF'

### Checking Account Settings Popups

EOF

for popup in NotificationsPopup PrivacyPopup DangerZonePopup; do
  FILE="app/[locale]/business/settings/account/_components/${popup}.tsx"
  echo "#### ${popup}.tsx"
  echo ""
  if [ -f "$FILE" ]; then
    echo '```typescript'
    cat "$FILE"
    echo '```'
  else
    echo "**FILE NOT FOUND**: $FILE"
  fi
  echo ""
done

cat << 'EOF'

---

## PART 4: Directory Structure

### Studio Settings Components
EOF

echo '```'
ls -la "app/[locale]/business/settings/studio/_components/" 2>/dev/null || echo "DIRECTORY NOT FOUND"
echo '```'
echo ""

echo "### Account Settings Components"
echo '```'
ls -la "app/[locale]/business/settings/account/_components/" 2>/dev/null || echo "DIRECTORY NOT FOUND"
echo '```'
echo ""

echo "### All Settings Directories"
echo '```'
ls -la "app/[locale]/business/settings/" 2>/dev/null || echo "DIRECTORY NOT FOUND"
echo '```'
echo ""

cat << 'EOF'

---

## PART 5: All Sheet Usage

### Files importing Sheet component
EOF

echo '```'
grep -r "from.*@/components/ui/sheet" app --include="*.tsx" 2>/dev/null | cut -d: -f1 | sort -u || echo "NO FILES FOUND"
echo '```'
echo ""

echo "---"
echo "**END OF RAW DATA**"

} > "$OUT"

echo "==============================================="
echo "Analysis complete!"
echo "Output file: $OUT"
echo "Size: $(wc -l < "$OUT") lines"
echo "==============================================="
echo ""
echo "To view the full report:"
echo "  cat $OUT"
echo ""
echo "To view specific sections:"
echo "  grep -A 50 'PART 1' $OUT"
echo "  grep -A 100 'PART 3' $OUT"
echo "==============================================="
