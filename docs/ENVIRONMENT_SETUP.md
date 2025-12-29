# Environment Variables Setup Guide

## 🔑 Overview

The subscription system requires environment variables for both **frontend** and **backend** (Firebase Functions).

## Frontend (.env.local at project root)

These variables are accessible in the browser via Vite:

```bash
# Firebase Configuration (already configured)
VITE_FIREBASE_API_KEY=...
VITE_PROJECT_ID=...
# ... other Firebase config

# Frontend-specific
VITE_APP_URL=http://localhost:5173

# ⚠️ DO NOT put Mercado Pago access token here!
# The frontend should never have direct access to the token
```

## Backend (functions/.env)

These variables are used by Firebase Functions (server-side only):

```bash
# Mercado Pago Access Token
# Get from: https://www.mercadopago.com.br/developers/panel/credentials
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx-xxxxxx-xxxx-xxxx

# Webhook Secret (optional for local dev)
# Get from: https://www.mercadopago.com.br/developers/panel/webhooks
MERCADOPAGO_WEBHOOK_SECRET=

# Frontend URL for redirects
FRONTEND_URL=http://localhost:5173
```

## 📝 Setup Steps

### 1. Create `functions/.env` file

```bash
cd functions
cp .env.example .env
```

### 2. Get Mercado Pago Credentials

1. Go to [Mercado Pago Developer Panel](https://www.mercadopago.com.br/developers/panel/credentials)
2. Copy your **TEST** access token (for development)
3. Paste it in `functions/.env`

### 3. Restart Firebase Emulators

**Important:** Environment variables are only loaded when emulators start.

```bash
# Stop current emulators (Ctrl+C or):
npm run stop-emulators

# Start emulators again:
npm run emulate
# or
firebase emulators:start
```

### 4. Verify Setup

Check the emulator logs when starting. You should see:
- ✅ Functions loaded successfully
- ✅ No "MERCADOPAGO_ACCESS_TOKEN environment variable is required" error

## 🚀 Production Deployment

### Option 1: Firebase Functions Config (Legacy)

```bash
firebase functions:config:set \
  mercadopago.access_token="APP_USR-xxxx-xxxxxx-xxxx-xxxx" \
  mercadopago.webhook_secret="your-webhook-secret" \
  frontend.url="https://yourdomain.com"

# Deploy
firebase deploy --only functions
```

Access in code:
```javascript
functions.config().mercadopago.access_token
```

### Option 2: Secret Manager (Recommended)

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create secrets
echo "APP_USR-xxxx-xxxxxx-xxxx-xxxx" | \
  gcloud secrets create mercadopago-access-token --data-file=-

echo "your-webhook-secret" | \
  gcloud secrets create mercadopago-webhook-secret --data-file=-

# Grant access to Cloud Functions
gcloud secrets add-iam-policy-binding mercadopago-access-token \
  --member="serviceAccount:YOUR-PROJECT-ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Update functions to use Secret Manager:
```javascript
import { defineSecret } from 'firebase-functions/params';

const mercadoPagoToken = defineSecret('MERCADOPAGO_ACCESS_TOKEN');

export const myFunction = onRequest(
  { secrets: [mercadoPagoToken] },
  (req, res) => {
    const token = mercadoPagoToken.value();
  }
);
```

### Option 3: .env file (Current Approach)

The `.env` file works for both emulator and deployed functions.

**Deployment:**
```bash
# Make sure .env is in functions/.gitignore (already done)
# Set environment variables in Firebase console or use CI/CD

# Deploy
cd functions
npm run deploy
```

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use TEST tokens for development
- ✅ Use production tokens only in production
- ✅ Keep `.env` in `.gitignore`
- ✅ Use different tokens for dev/staging/prod
- ✅ Rotate tokens regularly
- ✅ Use webhook secrets for signature verification

### ❌ DON'T:
- ❌ Commit `.env` files to git
- ❌ Share tokens in Slack/email
- ❌ Use production tokens in development
- ❌ Expose tokens in frontend code
- ❌ Use `VITE_` prefix for sensitive tokens (exposes to browser)

## 🐛 Troubleshooting

### Error: "MERCADOPAGO_ACCESS_TOKEN environment variable is required"

**Cause:** Functions can't find the environment variable.

**Solutions:**
1. Check `functions/.env` exists
2. Restart emulators to reload env vars
3. Check variable name is correct (no typo)
4. Check `.env` file syntax (no quotes around values unless needed)

### Error: "Failed to create subscription"

**Cause:** Invalid or expired token.

**Solutions:**
1. Verify token is valid in [Mercado Pago Panel](https://www.mercadopago.com.br/developers/panel/credentials)
2. Check token hasn't expired
3. Ensure you're using TEST token for sandbox
4. Check Mercado Pago account is active

### Functions work in emulator but fail in production

**Cause:** Environment variables not set in production.

**Solutions:**
1. Set variables using Firebase Console or CLI
2. Check deployment logs for errors
3. Verify service account has access to secrets

## 📚 Reference

- [Firebase Environment Variables](https://firebase.google.com/docs/functions/config-env)
- [Mercado Pago Credentials](https://www.mercadopago.com.br/developers/panel/credentials)
- [Mercado Pago Webhooks](https://www.mercadopago.com.br/developers/panel/webhooks)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## ⚡ Quick Reference

| Variable | Location | Purpose | Example |
|----------|----------|---------|---------|
| `VITE_FIREBASE_*` | `.env.local` (root) | Frontend Firebase config | Public |
| `MERCADOPAGO_ACCESS_TOKEN` | `functions/.env` | Backend MP API access | Secret |
| `MERCADOPAGO_WEBHOOK_SECRET` | `functions/.env` | Webhook verification | Secret |
| `FRONTEND_URL` | `functions/.env` | Payment redirects | `http://localhost:5173` |

---

**Last Updated:** December 2, 2025
