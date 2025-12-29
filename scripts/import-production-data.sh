#!/bin/bash

# Script to import production data into Firebase emulators
# Usage: ./scripts/import-production-data.sh [path-to-export-folder]

set -e

EXPORT_PATH="${1:-./production-export}"
TARGET_PATH="./emulator-data"

echo "🔄 Importing production data to emulator..."
echo "Source: $EXPORT_PATH"
echo "Target: $TARGET_PATH"

# Backup current emulator data
if [ -d "$TARGET_PATH" ]; then
  BACKUP_PATH="./emulator-data-backup-$(date +%Y%m%d-%H%M%S)"
  echo "📦 Backing up current data to $BACKUP_PATH"
  cp -r "$TARGET_PATH" "$BACKUP_PATH"
fi

# Copy production export to emulator data
echo "📋 Copying production data..."
rm -rf "$TARGET_PATH"
cp -r "$EXPORT_PATH" "$TARGET_PATH"

echo "✅ Import complete!"
echo ""
echo "To use this data, run:"
echo "  npm run emulate"
