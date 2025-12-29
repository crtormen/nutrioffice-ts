#!/bin/bash

# Setup Email Configuration for NutriOffice Functions
# This script helps configure email settings for both emulator and production

echo "========================================="
echo "NutriOffice Email Configuration Setup"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}Error: firebase.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo "This script will help you configure email for:"
echo "  1. Local emulator (creates functions/.runtimeconfig.json)"
echo "  2. Firebase cloud (sets firebase functions:config)"
echo ""

# Ask for email provider choice
echo "Which email service are you using?"
echo "  1. Gmail (recommended for testing)"
echo "  2. Other SMTP (SendGrid, Mailgun, etc.)"
read -p "Enter choice [1-2]: " email_provider

if [ "$email_provider" == "1" ]; then
    echo ""
    echo -e "${YELLOW}Gmail Setup Instructions:${NC}"
    echo "1. Enable 2-Factor Authentication on your Google account"
    echo "2. Go to https://myaccount.google.com/apppasswords"
    echo "3. Generate an App Password for 'Mail' > 'Other (Custom name)'"
    echo "4. Copy the 16-character password (no spaces)"
    echo ""
fi

# Get email credentials
read -p "Enter email address: " email_user
read -sp "Enter password/app-password: " email_password
echo ""

# Validate inputs
if [ -z "$email_user" ] || [ -z "$email_password" ]; then
    echo -e "${RED}Error: Email and password cannot be empty${NC}"
    exit 1
fi

# Create .runtimeconfig.json for emulator
echo ""
echo "Creating functions/.runtimeconfig.json for emulator..."

cat > functions/.runtimeconfig.json << EOF
{
  "email": {
    "user": "$email_user",
    "password": "$email_password"
  }
}
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Created functions/.runtimeconfig.json${NC}"
else
    echo -e "${RED}✗ Failed to create .runtimeconfig.json${NC}"
    exit 1
fi

# Ask if user wants to set Firebase cloud config
echo ""
read -p "Do you want to set Firebase cloud config too? (y/n): " set_cloud

if [ "$set_cloud" == "y" ] || [ "$set_cloud" == "Y" ]; then
    echo ""
    echo "Setting Firebase Functions config..."

    firebase functions:config:set email.user="$email_user" email.password="$email_password"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Firebase config set successfully${NC}"
        echo ""
        echo "To verify, run: firebase functions:config:get"
    else
        echo -e "${RED}✗ Failed to set Firebase config${NC}"
        echo "You can set it manually with:"
        echo "  firebase functions:config:set email.user=\"$email_user\" email.password=\"<password>\""
    fi
fi

# Create/update .env.local
echo ""
read -p "Do you want to configure frontend environment (.env.local)? (y/n): " set_env

if [ "$set_env" == "y" ] || [ "$set_env" == "Y" ]; then
    echo ""
    read -p "Enter app URL (e.g., http://localhost:5173): " app_url

    if [ -f ".env.local" ]; then
        # Backup existing file
        cp .env.local .env.local.backup
        echo -e "${YELLOW}Backed up existing .env.local to .env.local.backup${NC}"
    fi

    # Add or update VITE_APP_URL
    if grep -q "VITE_APP_URL" .env.local 2>/dev/null; then
        sed -i "s|VITE_APP_URL=.*|VITE_APP_URL=$app_url|" .env.local
    else
        echo "VITE_APP_URL=$app_url" >> .env.local
    fi

    echo -e "${GREEN}✓ Updated .env.local${NC}"
fi

# Summary
echo ""
echo "========================================="
echo -e "${GREEN}Configuration Complete!${NC}"
echo "========================================="
echo ""
echo "Files created/updated:"
echo "  ✓ functions/.runtimeconfig.json (for emulator)"
if [ "$set_cloud" == "y" ] || [ "$set_cloud" == "Y" ]; then
    echo "  ✓ Firebase cloud config (for production)"
fi
if [ "$set_env" == "y" ] || [ "$set_env" == "Y" ]; then
    echo "  ✓ .env.local (frontend environment)"
fi

echo ""
echo "Next steps:"
echo "  1. Build functions: cd functions && npm run build"
echo "  2. Start emulator: npm run emulate"
echo "  3. Test email: See TESTING_INVITATIONS.md"
echo ""
echo -e "${YELLOW}Important Security Notes:${NC}"
echo "  • functions/.runtimeconfig.json is in .gitignore (do not commit)"
echo "  • .env.local is in .gitignore (do not commit)"
echo "  • Keep your app password secure"
echo "  • Use different credentials for dev/production"
echo ""
