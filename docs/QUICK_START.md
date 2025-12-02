# Quick Start Guide - Invitation System

## 🚀 Get Started in 5 Minutes

### Step 1: Configure Email (2 minutes)

```bash
# Run the interactive setup script
./setup-email-config.sh
```

**What it does:**
- Creates `functions/.runtimeconfig.json` for emulator
- Optionally sets Firebase cloud config
- Configures frontend `.env.local`

**You'll need:**
- Gmail address
- Gmail App Password ([Get one here](https://myaccount.google.com/apppasswords))

### Step 2: Build & Start (1 minute)

```bash
# Build functions
cd functions && npm run build && cd ..

# Start emulators
npm run emulate
```

**Services will start:**
- 🔥 Firestore: http://localhost:8080
- 🔑 Auth: http://localhost:9099
- ⚡ Functions: http://localhost:5001
- 🎛️ UI: http://localhost:4000

### Step 3: Test (2 minutes)

Open a new terminal:

```bash
# Replace with your actual values
PROF_UID="your-professional-uid"
TOKEN="your-auth-token"

# Send test invitation
curl -X POST \
  http://localhost:5001/YOUR_PROJECT/us-central1/api/users/$PROF_UID/invitations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "role": "COLLABORATOR"
  }'
```

**Expected:** Email sent to test@example.com ✅

## 📁 Key Files

```
Backend (Complete ✅):
  functions/src/services/emailService.ts  - Email sending
  functions/src/api.ts                    - API endpoints (lines 310-689)
  firestore.rules                         - Security rules (lines 17-29)
  functions/.runtimeconfig.json           - Local config (create this)

Documentation (Complete ✅):
  INVITATION_SYSTEM.md                    - Full system docs
  EMAIL_SETUP.md                          - Email configuration
  TESTING_INVITATIONS.md                  - Testing guide
  IMPLEMENTATION_REVIEW.md                - Progress review
  QUICK_START.md                          - This file

Frontend (Not Started ⏳):
  src/pages/settings/                     - To be created
  src/components/Settings/                - To be created
  src/pages/auth/AcceptInvitationPage.tsx - To be created
```

## 🔧 Common Commands

```bash
# Email Configuration
./setup-email-config.sh                          # Interactive setup
firebase functions:config:get                    # View config
firebase functions:config:set email.user="..."   # Set manually

# Development
npm run build                                    # Build functions
npm run emulate                                  # Start all emulators
firebase functions:log                           # View logs

# Testing
curl http://localhost:5001/.../api/             # Test API
open http://localhost:4000                      # Open emulator UI

# Deployment
cd functions && npm run deploy                  # Deploy functions
firebase deploy --only firestore:rules          # Deploy rules
firebase deploy                                 # Deploy everything
```

## 🎯 API Endpoints Quick Reference

Base URL (Emulator): `http://localhost:5001/YOUR_PROJECT/us-central1/api`

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/users/:uid/invitations` | ✅ | Send invitation |
| GET | `/users/:uid/invitations` | ✅ | List invitations |
| GET | `/invitations/:token` | ❌ | Get invitation |
| POST | `/invitations/:token/accept` | ❌ | Accept invitation |
| DELETE | `/users/:uid/invitations/:id` | ✅ | Revoke invitation |
| POST | `/users/:uid/invitations/:id/resend` | ✅ | Resend email |

## ⚡ Quick Troubleshooting

### Email not sending?
```bash
# Check config
firebase functions:config:get

# Check file exists
ls -la functions/.runtimeconfig.json

# Check logs
firebase functions:log --only api
```

### Functions not working?
```bash
# Rebuild
cd functions && npm run build

# Restart emulator
# Ctrl+C then npm run emulate
```

### Can't access API?
```bash
# Check emulator is running
curl http://localhost:5001/YOUR_PROJECT/us-central1/api/
# Should return: "Hello world"
```

## 📖 Detailed Guides

- **Email Setup:** See [EMAIL_SETUP.md](EMAIL_SETUP.md)
- **Testing:** See [TESTING_INVITATIONS.md](TESTING_INVITATIONS.md)
- **Full Docs:** See [INVITATION_SYSTEM.md](INVITATION_SYSTEM.md)
- **Progress:** See [IMPLEMENTATION_REVIEW.md](IMPLEMENTATION_REVIEW.md)

## ✅ Success Checklist

- [ ] Email configured (check ✓)
- [ ] Functions built successfully
- [ ] Emulator started without errors
- [ ] API responds to requests
- [ ] Test email received
- [ ] Invitation email received
- [ ] Email link works correctly
- [ ] Ready to build frontend!

## 🆘 Need Help?

1. Check [INVITATION_SYSTEM.md](INVITATION_SYSTEM.md) - Comprehensive docs
2. Check [TESTING_INVITATIONS.md](TESTING_INVITATIONS.md) - Testing guide
3. Check logs: `firebase functions:log`
4. Check emulator UI: http://localhost:4000
5. Review [IMPLEMENTATION_REVIEW.md](IMPLEMENTATION_REVIEW.md) - Current status

## 🎉 What's Working Now

✅ **Backend (100% Complete)**
- Email service with Gmail
- 6 API endpoints
- Token-based invitations
- Security rules
- Comprehensive validation
- Error handling
- Documentation

⏳ **Frontend (Not Started)**
- Settings page
- Collaborators management
- Accept invitation page

## 📝 Next Steps

1. **Test the backend** (you are here!)
2. **Configure email** with real credentials
3. **Verify email delivery** works
4. **Review implementation** docs
5. **Plan frontend** architecture
6. **Build Settings page**
7. **Build Accept Invitation** page
8. **Test end-to-end** flow
9. **Deploy to production** 🚀

---

**Ready to test?** Run `./setup-email-config.sh` now! 🎯
