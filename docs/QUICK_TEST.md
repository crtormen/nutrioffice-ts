# Quick Test Checklist

## ✅ Pre-flight Check

- [x] Firebase emulators running
- [x] Dev server running on http://localhost:5173
- [x] API responding at http://localhost:5001/nutri-office/us-central1/api/
- [x] Email configured in functions/.runtimeconfig.json

## 🧪 Core Flow Test (5 minutes)

### 1. Login as Professional
- [ ] Go to http://localhost:5173/login
- [ ] Login with PROFESSIONAL account
- [ ] Navigate to `/user/profile` → "Colaboradores" tab

### 2. Send Invitation
- [ ] Click "Convidar Colaborador"
- [ ] Enter email: `test@example.com` (or your real email)
- [ ] Select role: "COLLABORATOR"
- [ ] Submit
- [ ] ✅ See success toast
- [ ] ✅ See invitation in "Convites Pendentes"

### 3. Check Email/Logs
- [ ] Check Functions terminal for email log
- [ ] Copy invitation link from logs or email
- [ ] Link format: `http://localhost:5173/accept-invitation?token=...`

### 4. Accept Invitation (in private/incognito window)
- [ ] Open invitation link
- [ ] ✅ See invitation details (professional name, role, email)
- [ ] Fill registration form:
  - Name: "Test Collaborator"
  - Phone: "11999999999"
  - Password: "test123"
  - Confirm: "test123"
- [ ] Submit
- [ ] ✅ See success message
- [ ] ✅ Redirected to login

### 5. Verify New User
- [ ] Login with new credentials
- [ ] ✅ Access granted
- [ ] ✅ Can see dashboard/interface
- [ ] Switch back to professional account
- [ ] ✅ New collaborator appears in "Colaboradores Ativos"

## 🔄 Additional Tests (optional)

### Resend
- [ ] Send another invitation
- [ ] Click "Reenviar" on pending invitation
- [ ] ✅ Success toast
- [ ] ✅ New email sent

### Revoke
- [ ] Click "Revogar" on pending invitation
- [ ] Confirm dialog
- [ ] ✅ Invitation removed
- [ ] Try to use revoked token
- [ ] ✅ Error: "Convite Não Encontrado"

### Limit
- [ ] Send/accept until 5 total collaborators
- [ ] ✅ "Convidar Colaborador" button disabled
- [ ] ✅ Alert shows limit reached
- [ ] Remove/revoke one
- [ ] ✅ Button enabled again

## 🐛 Debugging

### If invitation email doesn't send:
1. Check Functions logs for errors
2. Verify `.runtimeconfig.json` exists
3. Check Gmail App Password is correct
4. Copy link from Functions logs instead

### If "Convite Não Encontrado":
1. Check Firestore UI: http://localhost:4000/firestore
2. Look for `invitations` collection
3. Verify token matches document ID
4. Check status is "pending"

### If role-based access fails:
1. Check Firestore: `users/{uid}/roles/ability`
2. Verify custom claims set
3. User may need to logout/login for claims to refresh

## ✅ Success!

All tests passed? Great! The invitation system is fully working.

**Next steps:**
1. Deploy to production
2. Test with real email addresses
3. Train users on the workflow
4. Monitor for any issues

**Deployment:**
```bash
# Deploy functions
cd functions
npm run deploy

# Deploy frontend
cd ..
npm run build
firebase deploy --only hosting
```
