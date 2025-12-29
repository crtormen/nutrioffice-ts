#!/bin/bash

# Create a user in Firebase Auth Emulator with a specific UID
# This allows you to access production user data in the emulator
#
# Usage: ./scripts/create-emulator-user.sh <uid> <email> [password]
# Example: ./scripts/create-emulator-user.sh abc123xyz test@example.com mypassword

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <uid> <email> [password]"
    echo ""
    echo "Arguments:"
    echo "  uid      - The UID from your production user"
    echo "  email    - Email for the emulator user"
    echo "  password - Password for the emulator user (default: password123)"
    echo ""
    echo "Example:"
    echo "  $0 abc123xyz test@example.com mypassword"
    exit 1
fi

USER_UID="$1"
EMAIL="$2"
PASSWORD="${3:-password123}"
EMULATOR_URL="http://localhost:9099"

# Check if emulator is running
if ! curl -s "$EMULATOR_URL" > /dev/null 2>&1; then
    echo -e "${RED}Error: Auth emulator is not running${NC}"
    echo "Please start emulators first: npm run emulate"
    exit 1
fi

echo -e "${BLUE}Creating emulator user with custom UID${NC}"
echo "UID:      $USER_UID"
echo "Email:    $EMAIL"
echo "Password: $PASSWORD"
echo ""

# Create user with custom UID using Auth Emulator internal endpoint
# The emulator exposes special endpoints for testing that allow setting custom UIDs
RESPONSE=$(curl -s -X POST \
  "$EMULATOR_URL/emulator/v1/projects/demo-project/accounts" \
  -H "Content-Type: application/json" \
  -d "{
    \"localId\": \"$USER_UID\",
    \"email\": \"$EMAIL\",
    \"rawPassword\": \"$PASSWORD\",
    \"emailVerified\": true
  }")

# Check if successful
if echo "$RESPONSE" | grep -q "localId"; then
    echo -e "${GREEN}✅ User created successfully!${NC}"
    echo ""
    echo "Login credentials:"
    echo "  Email:    $EMAIL"
    echo "  Password: $PASSWORD"
    echo "  UID:      $USER_UID"
    echo ""
    echo "You can now log in to your app using these credentials."
    echo "The user will have access to data at: users/$USER_UID/*"
else
    echo -e "${RED}❌ Error creating user via API${NC}"
    echo "Response: $RESPONSE"
    echo ""
    echo -e "${YELLOW}The Auth Emulator API doesn't support setting custom UIDs.${NC}"
    echo ""
    echo "Use the alternative method instead:"
    echo ""
    echo "1. Stop emulators (Ctrl+C)"
    echo "2. Run: ./scripts/add-user-to-auth-export.sh $USER_UID $EMAIL $PASSWORD"
    echo "3. Restart: npm run emulate"
    echo ""
    exit 1
fi
