#!/bin/bash
# Comprehensive Popup Analysis Script
# Outputs all data to POPUP_ANALYSIS_OUTPUT.txt

cd /Users/roman/Development/massava
OUT="POPUP_ANALYSIS_OUTPUT.txt"

{
  echo "==============================================="
  echo "POPUP STYLING ANALYSIS - RAW DATA"
  echo "Generated: $(date)"
  echo "==============================================="
  echo ""

  # SECTION 1: Find reference implementation
  echo "### SECTION 1: REFERENCE IMPLEMENTATION SEARCH ###"
  echo ""
  echo "Files with side=\"bottom\" (these are reference candidates):"
  grep -r 'side="bottom"' app --include="*.tsx" -l 2>/dev/null || echo "[NO FILES FOUND]"
  echo ""

  # Get first reference file
  REF_FILE=$(grep -r 'side="bottom"' app --include="*.tsx" -l 2>/dev/null | head -1)

  if [ -n "$REF_FILE" ]; then
    echo "=== REFERENCE FILE CONTENT: $REF_FILE ==="
    echo ""
    cat "$REF_FILE"
    echo ""
    echo "=== END OF REFERENCE FILE ==="
  else
    echo "[NO REFERENCE FILE FOUND WITH side=bottom]"
  fi
  echo ""
  echo ""

  # SECTION 2: shadcn/ui Sheet component
  echo "### SECTION 2: SHADCN/UI SHEET COMPONENT ###"
  echo ""
  if [ -f "components/ui/sheet.tsx" ]; then
    echo "=== components/ui/sheet.tsx ==="
    echo ""
    cat "components/ui/sheet.tsx"
    echo ""
    echo "=== END OF SHEET COMPONENT ==="
  else
    echo "[components/ui/sheet.tsx NOT FOUND]"
  fi
  echo ""
  echo ""

  # SECTION 3: Studio Settings Popups
  echo "### SECTION 3: STUDIO SETTINGS POPUPS (NEW) ###"
  echo ""

  for popup in BasicInfoPopup LocationPopup OpeningHoursPopup ImagesPopup; do
    FILE="app/[locale]/business/settings/studio/_components/${popup}.tsx"
    echo "=== ${popup}.tsx ==="
    echo ""
    if [ -f "$FILE" ]; then
      cat "$FILE"
    else
      echo "[FILE NOT FOUND: $FILE]"
    fi
    echo ""
    echo "=== END OF ${popup} ==="
    echo ""
  done
  echo ""

  # SECTION 4: Account Settings Popups
  echo "### SECTION 4: ACCOUNT SETTINGS POPUPS (NEW) ###"
  echo ""

  for popup in NotificationsPopup PrivacyPopup DangerZonePopup; do
    FILE="app/[locale]/business/settings/account/_components/${popup}.tsx"
    echo "=== ${popup}.tsx ==="
    echo ""
    if [ -f "$FILE" ]; then
      cat "$FILE"
    else
      echo "[FILE NOT FOUND: $FILE]"
    fi
    echo ""
    echo "=== END OF ${popup} ==="
    echo ""
  done
  echo ""

  # SECTION 5: Directory structure check
  echo "### SECTION 5: DIRECTORY STRUCTURE ###"
  echo ""
  echo "Studio settings _components:"
  ls -la "app/[locale]/business/settings/studio/_components/" 2>/dev/null || echo "[DIRECTORY NOT FOUND]"
  echo ""
  echo "Account settings _components:"
  ls -la "app/[locale]/business/settings/account/_components/" 2>/dev/null || echo "[DIRECTORY NOT FOUND]"
  echo ""

  # SECTION 6: All Sheet usage in codebase
  echo "### SECTION 6: ALL SHEET USAGE ###"
  echo ""
  echo "Files importing Sheet component:"
  grep -r "from.*@/components/ui/sheet" app --include="*.tsx" 2>/dev/null | cut -d: -f1 | sort -u || echo "[NO FILES FOUND]"
  echo ""

  echo "==============================================="
  echo "END OF ANALYSIS DATA"
  echo "==============================================="

} > "$OUT" 2>&1

echo "Analysis complete! Data written to: $OUT"
echo "File size: $(wc -l < "$OUT") lines"

# Display first 100 lines as preview
echo ""
echo "=== PREVIEW (first 100 lines) ==="
head -100 "$OUT"
