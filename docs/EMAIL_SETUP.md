# Email Service Configuration Guide

## Step 1: Get Gmail App Password

### Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click **Security** in left menu
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow steps to enable 2FA if not already enabled

### Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Or: Google Account > Security > 2-Step Verification > App passwords
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Enter name: **NutriOffice Functions**
5. Click **Generate**
6. **Copy the 16-character password** (shown without spaces)
7. Save it somewhere safe - you'll only see it once!

## Step 2: Configure Firebase Functions (Local Development)

### Set configuration for local emulator:
```bash
# Navigate to functions directory
cd functions

# Set email configuration
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-16-char-app-password"

# Verify configuration
firebase functions:config:get
```

**Expected output:**
```json
{
  "email": {
    "user": "your-email@gmail.com",
    "password": "your-16-char-app-password"
  }
}
```

## Step 3: Configure for Emulator

For local emulator testing, create a file:

**File:** `functions/.runtimeconfig.json`
```json
{
  "email": {
    "user": "your-email@gmail.com",
    "password": "your-16-char-app-password"
  }
}
```

**Important:** This file is already in `.gitignore` - never commit it!

## Step 4: Test Email Service

### Option A: Using Firebase Emulator

1. Start emulator:
```bash
npm run emulate
```

2. Open Firebase Emulator UI:
```
http://localhost:4000
```

3. Go to Functions tab

4. Test invitation endpoint (see TESTING.md)

### Option B: Deploy and Test

1. Deploy functions:
```bash
cd functions
npm run deploy
```

2. Use production URL to test

## Step 5: Frontend Environment Variable

Create/update `.env.local` in project root:

```bash
# Development
VITE_APP_URL=http://localhost:5173

# Production (when deploying)
# VITE_APP_URL=https://your-app.com
```

This URL is used in the invitation email links.

## Troubleshooting

### Error: "Email configuration not found"

**Solution:** Create `functions/.runtimeconfig.json` file with email config

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Possible causes:**
1. ❌ Using regular Gmail password instead of App Password
   - **Fix:** Generate App Password (see Step 1)

2. ❌ 2-Factor Authentication not enabled
   - **Fix:** Enable 2FA first (see Step 1)

3. ❌ Copy-paste error in password
   - **Fix:** Remove any spaces, ensure 16 characters

4. ❌ Less secure app access disabled
   - **Fix:** Use App Password instead

### Error: "Cannot find module './services/emailService.js'"

**Solution:** Build functions first:
```bash
cd functions
npm run build
```

### Email sends but doesn't arrive

**Check:**
1. ✅ Spam folder
2. ✅ Email address typo
3. ✅ Gmail sending limits (500 emails/day)
4. ✅ Check Firebase Functions logs:
   ```bash
   firebase functions:log
   ```

## Alternative Email Services

If Gmail doesn't work, you can modify `functions/src/services/emailService.ts`:

### SendGrid (Recommended for production)
```typescript
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### Mailgun
```typescript
const transporter = nodemailer.createTransport({
  host: "smtp.mailgun.org",
  port: 587,
  auth: {
    user: emailConfig.user,
    pass: emailConfig.password
  }
});
```

### Amazon SES
```typescript
const transporter = nodemailer.createTransport({
  host: "email-smtp.us-east-1.amazonaws.com",
  port: 587,
  auth: {
    user: emailConfig.user,
    pass: emailConfig.password
  }
});
```

## Security Best Practices

✅ **Do:**
- Use App Passwords, not account password
- Keep `.runtimeconfig.json` in `.gitignore`
- Use environment-specific configurations
- Monitor sending limits
- Enable 2FA on email account

❌ **Don't:**
- Commit email credentials to git
- Share App Password
- Use regular password
- Hardcode credentials in code
- Exceed email provider limits

## Testing Checklist

- [ ] Gmail App Password generated
- [ ] Firebase config set (local)
- [ ] `.runtimeconfig.json` created
- [ ] `.env.local` has VITE_APP_URL
- [ ] Functions compiled (`npm run build`)
- [ ] Emulator started successfully
- [ ] Test email sent and received
- [ ] Invitation email sent and received
- [ ] Links in email work correctly

## Next Steps

After email is configured:
1. Test invitation flow (see TESTING.md)
2. Build frontend Settings page
3. Build Accept Invitation page
4. Deploy to production
