#!/bin/bash

# Script to initialize settings for the current logged-in user in emulator
# This is a helper that automatically finds your user ID

echo "🔍 Looking for user ID in emulator data..."

# Check if saved-data directory exists
if [ ! -d "saved-data/firestore_export" ]; then
  echo "❌ Error: saved-data/firestore_export directory not found"
  echo "💡 Make sure Firebase emulators are running with exported data"
  exit 1
fi

# Try to find user ID from exported data
# This looks for user documents in the firestore export
USER_ID=$(find saved-data/firestore_export -name "*.overall_export_metadata" -exec grep -o "users/[^/]*" {} \; | head -1 | cut -d'/' -f2)

if [ -z "$USER_ID" ]; then
  echo "❌ Could not automatically find user ID"
  echo "💡 Please run manually: npx ts-node scripts/initializeUserSettings.ts <your-user-id>"
  exit 1
fi

echo "✅ Found user ID: $USER_ID"
echo ""
echo "🚀 Initializing settings for user..."
echo ""

npx ts-node scripts/initializeUserSettings.ts "$USER_ID"
