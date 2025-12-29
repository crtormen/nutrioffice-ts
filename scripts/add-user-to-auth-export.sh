#!/bin/bash

# Add a user directly to the auth export file
# This is an alternative method when the API approach doesn't work
#
# Usage: ./scripts/add-user-to-auth-export.sh <uid> <email> [password]
# Example: ./scripts/add-user-to-auth-export.sh abc123xyz test@example.com mypassword
#
# IMPORTANT: Emulators must be STOPPED when running this script

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
    echo ""
    echo "IMPORTANT: Stop emulators before running this script!"
    exit 1
fi

USER_UID="$1"
EMAIL="$2"
PASSWORD="${3:-password123}"
AUTH_FILE="./emulator-data/auth_export/accounts.json"

# Check if auth export file exists
if [ ! -f "$AUTH_FILE" ]; then
    echo -e "${RED}Error: Auth export file not found at $AUTH_FILE${NC}"
    echo "Make sure emulators have been run at least once to create the export structure."
    exit 1
fi

# Check if emulator is running
if curl -s http://localhost:9099 > /dev/null 2>&1; then
    echo -e "${RED}Error: Emulators are still running${NC}"
    echo "Please stop emulators first (Ctrl+C in the emulator terminal)"
    exit 1
fi

echo -e "${BLUE}Adding user to auth export${NC}"
echo "UID:      $USER_UID"
echo "Email:    $EMAIL"
echo "Password: $PASSWORD"
echo ""

# Hash the password (Firebase uses scrypt, but for emulator we can use a simple hash)
# The emulator accepts plaintext passwords in a specific format
PASSWORD_HASH=$(echo -n "$PASSWORD" | base64)

# Create timestamp
CREATED_AT=$(date +%s)000

# Backup the original file
cp "$AUTH_FILE" "${AUTH_FILE}.backup"

# Create temporary JSON file for the new user
cat > /tmp/new_user.json <<EOF
{
  "localId": "$USER_UID",
  "email": "$EMAIL",
  "emailVerified": true,
  "passwordHash": "$PASSWORD_HASH",
  "salt": "",
  "createdAt": "$CREATED_AT",
  "lastLoginAt": "$CREATED_AT",
  "providerUserInfo": [
    {
      "providerId": "password",
      "email": "$EMAIL",
      "federatedId": "$EMAIL",
      "rawId": "$EMAIL"
    }
  ]
}
EOF

# Read existing users
EXISTING_USERS=$(cat "$AUTH_FILE")

# Add user using Python
python3 -c "
import json
import sys

try:
    # Read the auth file
    with open('$AUTH_FILE', 'r') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            data = {}

    # Initialize users array if needed
    if 'users' not in data:
        data['users'] = []

    # Check if user already exists
    user_exists = any(user.get('localId') == '$USER_UID' for user in data['users'])
    if user_exists:
        print('\033[1;33mWarning: User with UID $USER_UID already exists\033[0m')
        sys.exit(1)

    # Read new user from temp file
    with open('/tmp/new_user.json', 'r') as f:
        new_user = json.load(f)

    # Add new user
    data['users'].append(new_user)

    # Write back
    with open('$AUTH_FILE', 'w') as f:
        json.dump(data, f, indent=2)

    print('\033[0;32m✅ User added successfully!\033[0m')
except Exception as e:
    print(f'\033[0;31mError: {e}\033[0m')
    sys.exit(1)
"

echo ""
echo "Backup saved to: ${AUTH_FILE}.backup"
echo ""
echo "Next steps:"
echo "  1. Start emulators: npm run emulate"
echo "  2. Log in with:"
echo "     Email:    $EMAIL"
echo "     Password: $PASSWORD"
echo "  3. User will have access to: users/$USER_UID/*"
