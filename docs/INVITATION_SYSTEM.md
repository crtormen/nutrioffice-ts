# Invitation System Documentation

## Overview

The invitation system allows PROFESSIONAL users to invite collaborators to join their practice. Collaborators receive an email invitation and can register to access the professional's patient data according to their assigned role and permissions.

## Backend Components

### 1. Email Service (`functions/src/services/emailService.ts`)

Email service using Nodemailer with Gmail SMTP.

**Configuration Required:**
```bash
# Set Firebase function config for email
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"
```

**To get Gmail App Password:**
1. Go to Google Account Settings
2. Security > 2-Step Verification (enable if not already)
3. App Passwords > Generate new password
4. Copy the 16-character password

**Functions:**
- `sendInvitationEmail(data)` - Sends formatted HTML invitation email
- `sendTestEmail(email)` - Test email configuration

### 2. API Endpoints (`functions/src/api.ts`)

All invitation endpoints are in the Express API.

#### Send Invitation
```http
POST /users/:userId/invitations
Authorization: Bearer {token}

Body:
{
  "email": "collaborator@example.com",
  "role": "COLLABORATOR",
  "permissions": []
}

Response:
{
  "message": "Invitation sent successfully",
  "invitationId": "abc123",
  "emailSent": true
}
```

**Validations:**
- User must be PROFESSIONAL role
- Max 5 collaborators (configurable)
- No duplicate pending invitations
- Valid email format
- User with email doesn't already exist

#### Get Invitations
```http
GET /users/:userId/invitations?status=pending
Authorization: Bearer {token}

Response:
[
  {
    "id": "inv123",
    "email": "collaborator@example.com",
    "role": "COLLABORATOR",
    "permissions": [],
    "status": "pending",
    "createdAt": "2025-01-15T10:00:00Z",
    "expiresAt": "2025-01-22T10:00:00Z"
  }
]
```

#### Get Invitation by Token (Public)
```http
GET /invitations/:token

Response:
{
  "id": "inv123",
  "email": "collaborator@example.com",
  "professionalName": "Dr. João Silva",
  "role": "COLLABORATOR",
  "status": "pending",
  "expiresAt": "2025-01-22T10:00:00Z"
}
```

#### Accept Invitation
```http
POST /invitations/:token/accept

Body:
{
  "userId": "newuser123"
}

Response:
{
  "message": "Invitation accepted successfully",
  "professionalId": "prof123"
}
```

**Actions performed:**
1. Updates new user document with `contributesTo` field
2. Adds user to professional's `contributors` subcollection
3. Marks invitation as accepted
4. Custom claims auto-updated via Firestore trigger

#### Revoke Invitation
```http
DELETE /users/:userId/invitations/:invitationId
Authorization: Bearer {token}

Response:
{
  "message": "Invitation revoked successfully"
}
```

#### Resend Invitation
```http
POST /users/:userId/invitations/:invitationId/resend
Authorization: Bearer {token}

Response:
{
  "message": "Invitation resent successfully"
}
```

### 3. Firestore Database Structure

#### `/invitations/{invitationId}`
```typescript
{
  email: string;           // Lowercase
  professionalId: string;  // Professional's UID
  professionalName: string;
  role: Abilities;         // COLLABORATOR, SECRETARY, etc.
  permissions: string[];   // Future: granular permissions
  status: "pending" | "accepted" | "expired" | "revoked";
  token: string;           // UUID v4
  createdAt: Timestamp;
  expiresAt: Timestamp;    // 7 days from creation
  acceptedAt?: Timestamp;
  acceptedBy?: string;     // User ID who accepted
  revokedAt?: Timestamp;
  lastSentAt?: Timestamp;  // For resend tracking
}
```

#### `/users/{professionalId}/contributors/{contributorId}`
```typescript
{
  name: string;
  email: string;
  phone: string;
  roles: Abilities;
  permissions: string[];
  addedAt: Timestamp;
}
```

### 4. Security Rules

```javascript
match /invitations/{invitationId} {
  // Allow reading invitation by anyone (for registration)
  allow read: if true;

  // Only PROFESSIONAL can create invitations
  allow create: if isSignedIn() && isProfessional();

  // PROFESSIONAL can update, or anyone can accept pending
  allow update: if isSignedIn() && (
    isProfessional() ||
    resource.data.status == 'pending'
  );

  // Only PROFESSIONAL can delete
  allow delete: if isSignedIn() && isProfessional();
}
```

## Frontend Components (To Be Implemented)

### 1. Settings Page

**Route:** `/settings`

**Tabs:**
- **Dados Pessoais** - Personal data display/edit
- **Colaboradores** - Team management (PROFESSIONAL only)

### 2. Personal Data Tab

Display and edit user information:
- Name
- Email (read-only)
- Phone
- Profile picture (future)

### 3. Collaborators Tab

**For PROFESSIONAL role only:**

**Sections:**
- **Invite New Collaborator**
  - Email input
  - Role selector
  - Send button
  - Shows collaborator limit (X/5)

- **Active Collaborators**
  - List of contributors from subcollection
  - Display: name, email, role
  - Actions: Edit role, Remove

- **Pending Invitations**
  - List of pending invitations
  - Display: email, role, sent date, expires date
  - Actions: Resend, Revoke

### 4. Accept Invitation Page

**Route:** `/accept-invitation?token={token}`

**Flow:**
1. Validate token via API
2. Display invitation details:
   - Professional name
   - Role being offered
   - Expiration date
3. Registration form:
   - Email (pre-filled, read-only)
   - Name
   - Phone
   - Password
   - Confirm password
4. On submit:
   - Create Firebase Auth user
   - Create user document with role and contributesTo
   - Call accept invitation endpoint
   - Redirect to login

## User Flow Example

### Professional Invites Collaborator

1. Professional logs in
2. Goes to Settings > Colaboradores tab
3. Clicks "Invite Collaborator"
4. Fills form:
   - Email: maria@example.com
   - Role: SECRETARY
5. Clicks Send
6. System:
   - Creates invitation document
   - Sends email to maria@example.com
   - Shows success message

### Collaborator Accepts Invitation

1. Maria receives email
2. Clicks "Accept Invitation" button
3. Redirected to `/accept-invitation?token=abc123`
4. Sees invitation details:
   - "Dr. João Silva invited you as SECRETARY"
5. Fills registration form:
   - Name: Maria Santos
   - Phone: (11) 98765-4321
   - Password: ********
6. Submits form
7. System:
   - Creates auth user
   - Creates user document with contributesTo: dr_joao_uid
   - Adds to Dr. João's contributors subcollection
   - Custom claims updated automatically
8. Redirected to login
9. After login, Maria sees Dr. João's patients

## Configuration

### Email Service Setup

```bash
# Development (local emulator)
firebase functions:config:set email.user="test@gmail.com"
firebase functions:config:set email.password="your-app-password"

# Production
firebase functions:config:set email.user="production@nutrioffice.com"
firebase functions:config:set email.password="prod-app-password"

# View config
firebase functions:config:get

# Deploy with new config
firebase deploy --only functions
```

### Environment Variables

Create `.env.local` in frontend:
```
VITE_APP_URL=http://localhost:5173  # Development
# VITE_APP_URL=https://nutrioffice.com  # Production
```

## Testing

### Test Email Configuration

Use the Cloud Function console or create a test endpoint:
```typescript
import { sendTestEmail } from "./services/emailService";

// Send test
await sendTestEmail("your-email@example.com");
```

### Test Invitation Flow

1. **Create Professional User** (if not exists)
2. **Send Invitation:**
   ```bash
   POST http://localhost:5001/your-project/region/api/users/PROF_UID/invitations
   Headers: Authorization: Bearer YOUR_TOKEN
   Body: {"email": "test@example.com", "role": "COLLABORATOR"}
   ```

3. **Check Email** - Verify invitation email received

4. **Get Invitation:**
   ```bash
   GET http://localhost:5001/your-project/region/api/invitations/TOKEN
   ```

5. **Accept Invitation:**
   - Create user via Firebase Auth
   - Call accept endpoint with new userId

6. **Verify:**
   - Check user document has `contributesTo` field
   - Check professional's contributors subcollection
   - Verify custom claims updated

## Troubleshooting

### Email Not Sending

1. **Check configuration:**
   ```bash
   firebase functions:config:get
   ```

2. **Verify Gmail app password:**
   - Must be 16-character app password, not regular password
   - 2-factor authentication must be enabled

3. **Check function logs:**
   ```bash
   firebase functions:log --only api
   ```

4. **Test email directly:**
   ```javascript
   await sendTestEmail("your-email@example.com");
   ```

### Invitation Not Accepting

1. **Verify token is valid:**
   - Not expired (7 days)
   - Status is "pending"

2. **Check user exists:**
   - Firebase Auth user created successfully
   - User document exists in Firestore

3. **Verify permissions:**
   - Professional's contributors subcollection accessible
   - Firestore rules allow writes

### Custom Claims Not Updating

1. **Check trigger function:**
   - `onUpdateFirestoreUser` in functions/src/new.ts
   - Should auto-update when user document changes

2. **Manual refresh:**
   ```typescript
   // Frontend: Force token refresh
   await user.getIdToken(true);
   ```

3. **Verify claim structure:**
   ```typescript
   {
     role: "COLLABORATOR",
     contributesTo: "professional_uid",
     admin: false
   }
   ```

## Future Enhancements

1. **Granular Permissions**
   - Read-only access
   - Cannot delete patients
   - Cannot view financials
   - etc.

2. **Collaborator Limits**
   - Implement paid plans
   - Different limits per plan
   - Upgrade flow

3. **Team Activity Log**
   - Track who made what changes
   - Audit trail for compliance

4. **Invitation Management**
   - Bulk invitations
   - CSV import
   - Invitation templates

5. **Email Templates**
   - Customizable branding
   - Multiple languages
   - Rich HTML templates

## Security Considerations

✅ **Implemented:**
- Token-based invitations (UUID)
- 7-day expiration
- Email validation
- Role-based access control
- Collaborator limit (5 max)
- One-time use tokens
- Firestore security rules

🔒 **Best Practices:**
- Never expose tokens in URLs permanently
- Always verify invitation ownership
- Validate all inputs
- Use HTTPS only
- Rate limit invitation sends (future)
- Monitor for abuse (future)

## Support

For issues or questions:
1. Check Firebase Functions logs
2. Verify email configuration
3. Review Firestore rules
4. Check custom claims
5. Test with emulators first

## License

Proprietary - NutriOffice System
