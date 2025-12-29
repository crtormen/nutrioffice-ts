# Initializing User Settings

This guide explains how to initialize settings for users who don't have default settings configured. This is useful for:
- Migrating existing production users to the new settings system
- Fixing users imported from production backups into emulators
- Recovering from settings deletion

## Problem

When a user is created normally, the `onCreateFirestoreUserLoadDefaultSettings` trigger automatically creates their settings from `/settings/professional` or `/settings/contributor`. However, users imported from production backups or created outside the normal flow won't have these settings initialized.

Without settings, the anamnesis tab and other features won't work properly.

## Solutions

### 1. For Development (Emulator)

#### Option A: Using the TypeScript Script

Run the initialization script for a specific user:

```bash
# Make sure emulators are running first
npm run emulate

# In another terminal, run:
npx ts-node scripts/initializeUserSettings.ts <userId>
```

Example:
```bash
npx ts-node scripts/initializeUserSettings.ts abc123xyz
```

#### Option B: Using the Bash Helper Script

This automatically finds and initializes the first user in your emulator data:

```bash
chmod +x scripts/initializeCurrentUser.sh
./scripts/initializeCurrentUser.sh
```

### 2. For Production

#### Option A: Using Firebase Console

1. Open Firebase Console
2. Go to Functions
3. Find and run the `initializeUserSettings` function
4. Pass the user ID as a parameter (optional - if not provided, initializes for calling user)

#### Option B: Using the UI Component (Recommended)

Add the initialization button to your admin panel:

```tsx
import { InitializeUserSettingsButton } from "@/components/Admin/InitializeUserSettingsButton";

// In your admin component:
function UserManagement() {
  return (
    <div>
      {/* Initialize settings for current user */}
      <InitializeUserSettingsButton />

      {/* Initialize settings for specific user (admin only) */}
      <InitializeUserSettingsButton userId="some-user-id" />
    </div>
  );
}
```

#### Option C: Calling the Function Programmatically

```typescript
import { initializeUserSettings } from "@/app/services/UserSettingsService";

// Initialize settings for current user
const result = await initializeUserSettings();

// Initialize settings for specific user (admin only)
const result = await initializeUserSettings("some-user-id");

console.log(result);
// {
//   success: true,
//   userId: "abc123",
//   role: "PROFESSIONAL",
//   settingsType: "professional",
//   fieldsCount: 25,
//   created: true
// }
```

## How It Works

The `initializeUserSettings` Cloud Function:

1. **Authentication Check**: Verifies the caller is authenticated
2. **Permission Check**: If initializing another user's settings, verifies the caller is a PROFESSIONAL
3. **User Lookup**: Gets the target user's document to determine their role
4. **Settings Selection**: Loads settings from `/settings/professional` or `/settings/contributor` based on role
5. **Atomic Transaction**: Creates or updates both default and custom settings documents
6. **Returns Result**: Provides detailed information about what was initialized

## Settings Structure

After initialization, users will have:

```
/users/{userId}/
  ├── settings/
  │   ├── default/          # Contains default anamnesis fields and other settings
  │   └── custom/           # User's custom settings (initially empty)
```

For PROFESSIONAL users:
- Default settings come from `/settings/professional`
- Includes all anamnesis field definitions

For CONTRIBUTOR users:
- Default settings come from `/settings/contributor`
- Currently empty but can be configured

## Troubleshooting

### "Default settings not found" error

Make sure the default settings exist in Firestore:
1. Check if `/settings/professional` document exists
2. If not, run the `setDefaultSettingsOnFirestore` function first

### "Permission denied" error

- Regular users can only initialize their own settings
- Only PROFESSIONAL users can initialize settings for other users

### Settings not appearing in the app

After initializing settings:
1. Refresh the page to reload data
2. Check browser console for any errors
3. Verify settings were created in Firestore Console

## Batch Initialization

To initialize settings for multiple users at once, you can create a script:

```typescript
import { initializeUserSettings } from "@/app/services/UserSettingsService";

const userIds = ["user1", "user2", "user3"];

for (const userId of userIds) {
  try {
    const result = await initializeUserSettings(userId);
    console.log(`✅ Initialized ${userId}:`, result);
  } catch (error) {
    console.error(`❌ Failed to initialize ${userId}:`, error);
  }
}
```

## Related Functions

- `onCreateFirestoreUserLoadDefaultSettings`: Automatic trigger when user is created
- `reloadDefaultSettingsToUser`: Legacy function that only reloads for current user
- `setDefaultSettingsOnFirestore`: Creates the default settings templates
