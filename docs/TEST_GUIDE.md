# Invitation System - Test Guide

## ✅ Setup Complete

Your system is now properly configured:
- ✅ Firebase emulators running on correct ports
- ✅ API endpoint accessible at `http://localhost:5001/nutri-office/us-central1/api/`
- ✅ Email service configured with Gmail SMTP
- ✅ All invitation endpoints available

## Testing with the UI (Recommended)

### Step 1: Start the Dev Server

```bash
# In a new terminal (keep emulators running)
npm run dev
```

Access the app at: http://localhost:5173

### Step 2: Login as Professional

1. Go to http://localhost:5173/login
2. Login with a PROFESSIONAL user account
   - If you don't have one, create via http://localhost:5173/signup
   - The user needs to have `roles.ability = "PROFESSIONAL"` in Firestore

### Step 3: Navigate to Collaborators Tab

1. Click on your profile/account menu
2. Go to "Profile" or navigate to `/user/profile`
3. Click on the "Colaboradores" tab

### Step 4: Send an Invitation

1. Click "Convidar Colaborador" button
2. Fill in:
   - **Email**: Use a real email you can access (or check Functions logs for the link)
   - **Role**: Select "COLLABORATOR" or any other role
3. Click "Enviar Convite"

**Expected Results:**
- ✅ Success toast: "Convite enviado com sucesso!"
- ✅ Invitation appears in "Convites Pendentes" section
- ✅ Email sent to the address (check inbox/spam)
- ✅ Functions logs show email sent

**Check Functions Logs:**
```bash
# In terminal where emulators are running, you'll see:
# > Sending invitation email to: collaborator@example.com
# > Invitation email sent successfully
```

### Step 5: Accept the Invitation

**Option A: From Email Link**
1. Open the invitation email
2. Click "Aceitar Convite" button
3. You'll be redirected to: `http://localhost:5173/accept-invitation?token=...`

**Option B: Direct URL (for testing)**
1. Copy the token from the Firestore UI (http://localhost:4000/firestore)
   - Navigate to `invitations` collection
   - Copy the document ID (this is the token)
2. Go to: `http://localhost:5173/accept-invitation?token=YOUR_TOKEN`

**Registration Flow:**
1. You'll see invitation details card with:
   - Professional name
   - Your email (pre-filled)
   - Role assigned
   - Expiry date
2. Fill in the registration form:
   - Name
   - Phone
   - Password
   - Confirm Password
3. Click "Aceitar Convite e Criar Conta"

**Expected Results:**
- ✅ Success toast: "Conta criada com sucesso!"
- ✅ Auto-redirect to login page
- ✅ Can login with the new credentials
- ✅ User appears in professional's "Colaboradores Ativos"
- ✅ User has `contributesTo` field pointing to professional's UID
- ✅ User has correct role in custom claims

### Step 6: Verify New User

1. Login with the new collaborator credentials
2. Check that you can access the system
3. Verify role-based permissions work
4. Navigate back to professional's account
5. Check "Colaboradores Ativos" section
6. Verify the new collaborator appears in the list

### Step 7: Test Resend Invitation

1. Send another invitation to a different email
2. In "Convites Pendentes", click "Reenviar" button
3. Verify success toast
4. Check that a new email was sent

### Step 8: Test Revoke Invitation

1. In "Convites Pendentes", click "Revogar" button
2. Confirm in the dialog
3. Verify invitation removed from list
4. Try to use the revoked token in accept-invitation URL
5. Verify error: "Convite Não Encontrado"

### Step 9: Test Collaborator Limit

1. Send invitations until you reach 5 total (active + pending)
2. Verify "Convidar Colaborador" button becomes disabled
3. Verify alert shows: "Limite de colaboradores atingido"
4. Revoke or remove one
5. Verify button becomes enabled again

## Testing with cURL (Advanced)

### Get Auth Token

1. Login via UI
2. Open browser DevTools → Console
3. Run:
```javascript
firebase.auth().currentUser.getIdToken().then(token => console.log(token))
```
4. Copy the token

### Send Invitation

```bash
# Replace YOUR_ID_TOKEN and YOUR_UID
curl -X POST \
  http://localhost:5001/nutri-office/us-central1/api/users/YOUR_UID/invitations \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "role": "COLLABORATOR",
    "permissions": []
  }'
```

### Get Invitations

```bash
curl -X GET \
  "http://localhost:5001/nutri-office/us-central1/api/users/YOUR_UID/invitations?status=pending" \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

### Get Invitation by Token (Public)

```bash
curl -X GET \
  http://localhost:5001/nutri-office/us-central1/api/invitations/YOUR_TOKEN
```

## Checking Firestore Data

Open Firebase Emulator UI: http://localhost:4000/firestore

**Check Invitations:**
- Collection: `invitations`
- Look for documents with status: "pending"

**Check Users:**
- Collection: `users`
- Check `contributesTo` field on new users
- Check `roles.ability` field

**Check Contributors:**
- Collection: `users/{professionalUid}/contributors`
- Verify new collaborators appear here

## Checking Email Logs

In the terminal where emulators are running, look for:

```
> functions[us-central1-api]: Sending invitation email to: test@example.com
> functions[us-central1-api]: Invitation link: http://localhost:5173/accept-invitation?token=...
> functions[us-central1-api]: Invitation email sent successfully
```

## Common Issues

### Issue: "Could not resolve host"
**Solution:** Make sure you're using the correct project ID: `nutri-office` (not `nutrioffice-ts`)

### Issue: "User not authenticated"
**Solution:** Make sure you're logged in and the auth token is valid

### Issue: "Invitation not found"
**Solution:**
- Check if token is correct
- Check if invitation is expired or revoked
- Check Firestore to verify invitation exists

### Issue: Email not received
**Solution:**
- Check Functions logs for errors
- Verify Gmail App Password is correct in `.runtimeconfig.json`
- Check spam folder
- For testing, you can copy the link from Functions logs

### Issue: "Limit reached"
**Solution:**
- You have 5 active collaborators + pending invitations
- Revoke pending invitations or remove collaborators
- This is by design (5 collaborator limit)

## Success Criteria

✅ All tests passing means:
- Professional can send invitations
- Invitations are saved to Firestore
- Emails are sent (or links are in logs)
- Collaborators can accept and register
- New users have correct roles and contributesTo
- Contributors appear in professional's list
- Resend/revoke actions work
- Limit enforcement works
- Expired invitations are handled
- Role-based access control works

## Next Steps

Once all tests pass:
1. Review code for any improvements
2. Deploy to production:
   ```bash
   # Deploy functions
   cd functions && npm run deploy

   # Deploy hosting
   npm run build
   firebase deploy --only hosting
   ```
3. Update production environment variables
4. Test in production environment
