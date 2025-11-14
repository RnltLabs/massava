#!/usr/bin/env python3
"""
Popup Styling Analysis Script
Gathers all popup code and compares styling
"""

import os
import glob
from pathlib import Path

# Base directory
BASE_DIR = Path("/Users/roman/Development/massava")
APP_DIR = BASE_DIR / "app" / "[locale]" / "business" / "settings"

# Output file
OUTPUT = BASE_DIR / "PYTHON_POPUP_ANALYSIS.md"

def find_reference_popup():
    """Find files with side='bottom'"""
    print("Searching for reference popup...")
    result = []

    for tsx_file in BASE_DIR.glob("app/**/*.tsx"):
        try:
            content = tsx_file.read_text()
            if 'side="bottom"' in content:
                result.append(str(tsx_file))
        except:
            pass

    return result

def read_file_safe(filepath):
    """Safely read file content"""
    try:
        return Path(filepath).read_text()
    except Exception as e:
        return f"[ERROR READING FILE: {e}]"

def main():
    output_lines = []

    output_lines.append("# Popup Styling Analysis - Python Script Output\n")
    output_lines.append(f"Generated from: {BASE_DIR}\n\n")

    # Part 1: Find reference
    output_lines.append("## Part 1: Reference Popup Search\n\n")
    ref_files = find_reference_popup()
    if ref_files:
        output_lines.append(f"Found {len(ref_files)} file(s) with side=\"bottom\":\n\n")
        for f in ref_files:
            output_lines.append(f"- `{f}`\n")
        output_lines.append("\n### First Reference File Content:\n\n")
        output_lines.append(f"**File**: `{ref_files[0]}`\n\n")
        output_lines.append("```typescript\n")
        output_lines.append(read_file_safe(ref_files[0]))
        output_lines.append("\n```\n\n")
    else:
        output_lines.append("NO FILES FOUND with side=\"bottom\"\n\n")

    # Part 2: shadcn/ui Sheet component
    output_lines.append("## Part 2: shadcn/ui Sheet Component\n\n")
    sheet_file = BASE_DIR / "components" / "ui" / "sheet.tsx"
    if sheet_file.exists():
        output_lines.append("```typescript\n")
        output_lines.append(read_file_safe(sheet_file))
        output_lines.append("\n```\n\n")
    else:
        output_lines.append(f"NOT FOUND: {sheet_file}\n\n")

    # Part 3: New popups
    output_lines.append("## Part 3: New Popup Files\n\n")

    # Studio settings popups
    output_lines.append("### Studio Settings Popups\n\n")
    studio_popups = ["BasicInfoPopup", "LocationPopup", "OpeningHoursPopup", "ImagesPopup"]
    studio_dir = APP_DIR / "studio" / "_components"

    for popup in studio_popups:
        popup_file = studio_dir / f"{popup}.tsx"
        output_lines.append(f"#### {popup}.tsx\n\n")
        if popup_file.exists():
            output_lines.append(f"**Path**: `{popup_file}`\n\n")
            output_lines.append("```typescript\n")
            output_lines.append(read_file_safe(popup_file))
            output_lines.append("\n```\n\n")
        else:
            output_lines.append(f"NOT FOUND: `{popup_file}`\n\n")

    # Account settings popups
    output_lines.append("### Account Settings Popups\n\n")
    account_popups = ["NotificationsPopup", "PrivacyPopup", "DangerZonePopup"]
    account_dir = APP_DIR / "account" / "_components"

    for popup in account_popups:
        popup_file = account_dir / f"{popup}.tsx"
        output_lines.append(f"#### {popup}.tsx\n\n")
        if popup_file.exists():
            output_lines.append(f"**Path**: `{popup_file}`\n\n")
            output_lines.append("```typescript\n")
            output_lines.append(read_file_safe(popup_file))
            output_lines.append("\n```\n\n")
        else:
            output_lines.append(f"NOT FOUND: `{popup_file}`\n\n")

    # Part 4: Directory listings
    output_lines.append("## Part 4: Directory Structure\n\n")

    if studio_dir.exists():
        output_lines.append("### Studio Settings Components:\n\n")
        for item in sorted(studio_dir.iterdir()):
            output_lines.append(f"- {item.name}\n")
        output_lines.append("\n")

    if account_dir.exists():
        output_lines.append("### Account Settings Components:\n\n")
        for item in sorted(account_dir.iterdir()):
            output_lines.append(f"- {item.name}\n")
        output_lines.append("\n")

    # Write output
    OUTPUT.write_text("".join(output_lines))
    print(f"\nAnalysis complete!")
    print(f"Output written to: {OUTPUT}")
    print(f"Lines: {len(output_lines)}")

    # Also print first 50 lines as preview
    print("\n" + "="*60)
    print("PREVIEW (first 50 lines):")
    print("="*60)
    print("".join(output_lines[:50]))

if __name__ == "__main__":
    main()
