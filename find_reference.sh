#!/bin/bash
cd /Users/roman/Development/massava
echo "Finding reference popup with side=bottom..."
grep -r 'side="bottom"' app --include="*.tsx" -l 2>/dev/null | head -5
