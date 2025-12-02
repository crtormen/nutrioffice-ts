# Testing Invitation System

## Prerequisites

1. ✅ Email service configured (see EMAIL_SETUP.md)
2. ✅ Firebase emulators running
3. ✅ Functions compiled
4. ✅ Test user with PROFESSIONAL role exists

## Quick Start

```bash
# Terminal 1: Start emulators with functions
npm run emulate

# Terminal 2: Check if API is running
curl http://localhost:5001/nutri-office/us-central1/api/
# Should return: "Hello world"
```

## Test Scenarios

### Scenario 1: Send Invitation (Happy Path)

**Prerequisites:**
- Professional user logged in
- Professional has < 5 collaborators

**Steps:**

1. **Get Auth Token:**
```bash
# Login via your app and get the ID token
# Or use Firebase Auth emulator UI: http://localhost:4000/auth
```

2. **Send Invitation:**
```bash
curl -X POST \
  http://localhost:5001/nutri-office/us-central1/api/users/PROFESSIONAL_UID/invitations \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "collaborator@example.com",
    "role": "COLLABORATOR",
    "permissions": []
  }'
```

**Expected Response:**
```json
{
  "message": "Invitation sent successfully",
  "invitationId": "abc123...",
  "emailSent": true
}
```

**Verify:**
- ✅ Email received at collaborator@example.com
- ✅ Email contains accept link with token
- ✅ Invitation document created in Firestore
- ✅ Check emulator UI: http://localhost:4000/firestore

### Scenario 2: Get Invitation by Token

**Steps:**

1. **Copy token from email link** (or from Firestore)

2. **Get invitation details:**
```bash
curl http://localhost:5001/YOUR_PROJECT_ID/us-central1/api/invitations/TOKEN_HERE
```

**Expected Response:**
```json
{
  "id": "inv123",
  "email": "collaborator@example.com",
  "professionalName": "Dr. João Silva",
  "role": "COLLABORATOR",
  "status": "pending",
  "expiresAt": "2025-01-30T10:00:00Z"
}
```

### Scenario 3: Accept Invitation

**Prerequisites:**
- Valid invitation token
- New user created in Firebase Auth

**Steps:**

1. **Create new user** (simulate registration):
```bash
# Use Firebase Auth emulator or your registration flow
# Get the new user's UID
```

2. **Accept invitation:**
```bash
curl -X POST \
  http://localhost:5001/YOUR_PROJECT_ID/us-central1/api/invitations/TOKEN_HERE/accept \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "NEW_USER_UID"
  }'
```

**Expected Response:**
```json
{
  "message": "Invitation accepted successfully",
  "professionalId": "PROF_UID"
}
```

**Verify:**
- ✅ User document has `contributesTo: PROF_UID`
- ✅ User added to `/users/PROF_UID/contributors/NEW_USER_UID`
- ✅ Invitation status changed to "accepted"
- ✅ Custom claims updated (check after token refresh)

### Scenario 4: List Invitations

**Steps:**

1. **Get all invitations:**
```bash
curl -X GET \
  http://localhost:5001/YOUR_PROJECT_ID/us-central1/api/users/PROF_UID/invitations \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

2. **Filter by status:**
```bash
curl -X GET \
  "http://localhost:5001/YOUR_PROJECT_ID/us-central1/api/users/PROF_UID/invitations?status=pending" \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": "inv1",
    "email": "user1@example.com",
    "role": "COLLABORATOR",
    "permissions": [],
    "status": "pending",
    "createdAt": "2025-01-15T10:00:00Z",
    "expiresAt": "2025-01-22T10:00:00Z"
  }
]
```

### Scenario 5: Revoke Invitation

**Steps:**

```bash
curl -X DELETE \
  http://localhost:5001/YOUR_PROJECT_ID/us-central1/api/users/PROF_UID/invitations/INVITATION_ID \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Invitation revoked successfully"
}
```

**Verify:**
- ✅ Invitation status changed to "revoked"
- ✅ `revokedAt` timestamp added

### Scenario 6: Resend Invitation

**Steps:**

```bash
curl -X POST \
  http://localhost:5001/YOUR_PROJECT_ID/us-central1/api/users/PROF_UID/invitations/INVITATION_ID/resend \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Invitation resent successfully"
}
```

**Verify:**
- ✅ New email received
- ✅ `lastSentAt` timestamp updated in Firestore

## Error Testing

### Test: Invalid Email Format

```bash
curl -X POST \
  http://localhost:5001/YOUR_PROJECT_ID/us-central1/api/users/PROF_UID/invitations \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "role": "COLLABORATOR"}'
```

**Expected:** `400 - Invalid email format`

### Test: Collaborator Limit Reached

**Setup:** Create 5 contributors first

**Expected:** `400 - Collaborator limit reached`

### Test: Duplicate Invitation

**Setup:** Send invitation to same email twice

**Expected:** `400 - Invitation already sent`

### Test: User Already Exists

**Setup:** Try to invite email that has Firebase Auth account

**Expected:** `400 - User already exists`

### Test: Expired Invitation

**Setup:** Set `expiresAt` to past date in Firestore

```bash
curl http://localhost:5001/YOUR_PROJECT_ID/us-central1/api/invitations/TOKEN_HERE
```

**Expected:** `400 - Invitation expired`

### Test: Non-Professional Tries to Invite

**Setup:** Use token from user with COLLABORATOR role

**Expected:** `403 - Only professionals can send invitations`

## Integration Testing with Frontend

### Test Full Flow

1. **Professional sends invitation:**
   - Open Settings > Colaboradores
   - Fill form with collaborator email
   - Click "Send Invitation"
   - Verify success message

2. **Collaborator receives email:**
   - Check email inbox
   - Verify email content
   - Click "Accept Invitation" link

3. **Collaborator registers:**
   - Lands on `/accept-invitation?token=...`
   - Sees professional name and role
   - Fills registration form
   - Submits

4. **Verify access:**
   - Collaborator logs in
   - Should see professional's patients
   - Cannot access Settings > Colaboradores (not PROFESSIONAL)

## Monitoring & Debugging

### Check Function Logs

```bash
# Real-time logs
firebase functions:log --only api

# Specific function
firebase functions:log --only api --lines 50
```

### Check Firestore Data

1. Open emulator UI: http://localhost:4000
2. Go to Firestore tab
3. Check collections:
   - `/invitations` - All invitations
   - `/users/{uid}/contributors` - Accepted collaborators
   - `/users/{uid}` - Check `contributesTo` field

### Check Auth Custom Claims

```bash
# Create test endpoint or use Firebase console
GET http://localhost:5001/YOUR_PROJECT_ID/us-central1/api/check-claims?id=USER_UID
```

## Performance Testing

### Test: Send Multiple Invitations

```bash
for i in {1..10}; do
  curl -X POST \
    http://localhost:5001/YOUR_PROJECT_ID/us-central1/api/users/PROF_UID/invitations \
    -H "Authorization: Bearer YOUR_ID_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"user$i@example.com\", \"role\": \"COLLABORATOR\"}"
  echo ""
done
```

### Test: Concurrent Requests

```bash
# Install apache bench
sudo apt-get install apache2-utils

# Test endpoint performance
ab -n 100 -c 10 \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  http://localhost:5001/YOUR_PROJECT_ID/us-central1/api/users/PROF_UID/invitations
```

## Test Data Setup

### Create Test Professional

```javascript
// In Firebase Auth Emulator or via createAuthUser function
{
  email: "professional@nutrioffice.com",
  password: "Test123!",
  displayName: "Dr. Test Professional"
}

// In Firestore /users/{uid}
{
  name: "Dr. Test Professional",
  email: "professional@nutrioffice.com",
  roles: {
    ability: "PROFESSIONAL"
  }
}
```

### Create Test Invitation

```javascript
// In Firestore /invitations/{id}
{
  email: "collaborator@example.com",
  professionalId: "PROF_UID",
  professionalName: "Dr. Test Professional",
  role: "COLLABORATOR",
  permissions: [],
  status: "pending",
  token: "test-token-123",
  createdAt: Timestamp.now(),
  expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
}
```

## Cleanup After Testing

```bash
# Stop emulators
Ctrl+C

# Clear emulator data
firebase emulators:exec --only firestore "echo 'Clearing data'"

# Or delete specific collections in emulator UI
```

## Checklist: Pre-Deployment Testing

- [ ] Send invitation successfully
- [ ] Receive email with correct format
- [ ] Email link works correctly
- [ ] Get invitation by token
- [ ] Accept invitation creates all documents
- [ ] Custom claims updated correctly
- [ ] List invitations works
- [ ] Revoke invitation works
- [ ] Resend invitation works
- [ ] Error cases handled correctly:
  - [ ] Invalid email
  - [ ] Duplicate invitation
  - [ ] User already exists
  - [ ] Expired invitation
  - [ ] Non-professional access
  - [ ] Collaborator limit
- [ ] Email limits respected
- [ ] Performance acceptable
- [ ] Security rules working
- [ ] Logs are clear and helpful

## Next: Deploy to Production

Once all tests pass:

```bash
# Deploy functions
cd functions
npm run deploy

# Deploy firestore rules
firebase deploy --only firestore:rules

# Set production email config
firebase functions:config:set email.user="production@nutrioffice.com"
firebase functions:config:set email.password="prod-app-password"

# Redeploy with new config
firebase deploy --only functions
```

## Support

If tests fail, check:
1. Firebase Functions logs
2. Firestore security rules
3. Email configuration
4. Auth token validity
5. Network connectivity
6. CORS settings
