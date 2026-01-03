# Initialize Evaluation Settings

This guide explains how to set up default evaluation settings for existing and new users.

## Overview

The evaluation settings system allows configuring:
- Which fields are enabled for online vs. presencial consultations
- Evaluation protocols (JP3, JP7, DW4, Bioimpedance)
- Custom measurement points and fold points

## For New Users (Automatic)

When a new user account is created, the `onCreateFirestoreUserLoadDefaultSettings` Firebase function automatically:
1. Detects if the user is a PROFESSIONAL or COLLABORATOR
2. Loads settings from `/settings/professional` or `/settings/contributor`
3. Creates `/users/{userId}/settings/default` with all settings including evaluation
4. Creates `/users/{userId}/settings/custom` as empty object

**No manual action needed** for new users after running step 1 below.

## For Existing Users (Manual Steps Required)

### Step 1: Update Root Settings Collection

First, update the global settings that will be used as templates:

1. Deploy the updated functions:
   ```bash
   cd functions
   npm run deploy
   ```

2. Call the `setDefaultSettingsOnFirestore` function via HTTP:
   ```bash
   # Using curl
   curl -X POST https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/setDefaultSettingsOnFirestore

   # Or access directly in browser
   https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/setDefaultSettingsOnFirestore
   ```

This will update `/settings/professional` with:
- `anamnesis`: All anamnesis fields
- `evaluation`: Default evaluation config (presencial: JP7, online: basic fields)
- `evaluationPresets`: All 4 presets (jp3folds, jp7folds, dw4folds, bioimpedance)

### Step 2: Initialize Settings for Existing Users

For each existing user that doesn't have evaluation settings, call the `initializeUserSettings` function:

**Option A: Via Firebase Console Functions tab**
1. Go to Firebase Console → Functions
2. Find `initializeUserSettings`
3. Click "Test function"
4. Send payload: `{ "userId": "USER_ID_HERE" }` (optional, defaults to caller's ID)

**Option B: Via Frontend (Add Button in Admin Panel)**

Add this to your admin panel:

```typescript
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const initializeSettings = httpsCallable(functions, 'initializeUserSettings');

// Initialize for current user
const handleInitialize = async () => {
  try {
    const result = await initializeSettings();
    console.log('Settings initialized:', result.data);
    toast.success('Configurações inicializadas com sucesso!');
  } catch (error) {
    console.error('Error:', error);
    toast.error('Erro ao inicializar configurações');
  }
};

// Initialize for specific user (admin only)
const handleInitializeForUser = async (userId: string) => {
  try {
    const result = await initializeSettings({ userId });
    console.log('Settings initialized for user:', result.data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Option C: Via Firebase CLI (Batch Script)**

Create a script to initialize all existing users:

```javascript
// scripts/initialize-all-users.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const functions = admin.functions();
const db = admin.firestore();

async function initializeAllUsers() {
  const usersSnapshot = await db.collection('users').get();

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const settingsDoc = await db.doc(`users/${userId}/settings/default`).get();

    // Check if evaluation settings exist
    const hasEvaluation = settingsDoc.exists && settingsDoc.data()?.evaluation;

    if (!hasEvaluation) {
      console.log(`Initializing settings for user ${userId}...`);
      try {
        const initializeUserSettings = functions.httpsCallable('initializeUserSettings');
        const result = await initializeUserSettings({ userId });
        console.log(`✓ User ${userId}:`, result.data);
      } catch (error) {
        console.error(`✗ Failed for user ${userId}:`, error.message);
      }
    } else {
      console.log(`⊘ User ${userId} already has evaluation settings`);
    }
  }

  console.log('Done!');
}

initializeAllUsers().catch(console.error);
```

## Verification

After initialization, verify the settings exist:

1. **Via Firebase Console:**
   - Navigate to Firestore
   - Go to `/users/{userId}/settings/default`
   - Check that `evaluation` and `evaluationPresets` fields exist

2. **Via Frontend:**
   - Go to Settings → Avaliação
   - You should see the evaluation configuration cards
   - Presencial should show JP7 protocol selected
   - Online should show basic fields enabled

## Settings Structure

After initialization, `/users/{userId}/settings/default` will contain:

```javascript
{
  anamnesis: { /* anamnesis fields */ },
  evaluation: {
    presencial: {
      enabled: true,
      basePreset: "jp7folds",
      fields: {
        weight: { enabled: true, label: "Peso", required: true },
        height: { enabled: true, label: "Altura", required: true },
        folds: { enabled: true, protocol: "jp7", points: [...] },
        measures: { enabled: true, points: [...] },
        photos: { enabled: true, positions: ["front", "back", "side"] },
        bioimpedance: { enabled: false }
      }
    },
    online: {
      enabled: true,
      basePreset: null,
      fields: {
        weight: { enabled: true },
        height: { enabled: true },
        photos: { enabled: true },
        measures: { enabled: true, points: [...] },
        folds: { enabled: false, points: [] },
        bioimpedance: { enabled: false }
      }
    }
  },
  evaluationPresets: {
    jp3folds: { /* preset config */ },
    jp7folds: { /* preset config */ },
    dw4folds: { /* preset config */ },
    bioimpedance: { /* preset config */ }
  }
}
```

## Troubleshooting

### "Erro ao carregar configuração de avaliação"

This means the evaluation settings don't exist for the user. Follow Step 2 above.

### Empty evaluation settings tab

1. Check browser console for errors
2. Verify settings exist in Firestore at `/users/{userId}/settings/default/evaluation`
3. Try refreshing the page
4. Run `initializeUserSettings` for the user

### Functions deployment fails

1. Ensure you're in the functions directory: `cd functions`
2. Check TypeScript compilation: `npm run build`
3. Verify imports are correct in `functions/src/new.ts`
4. Check that `evaluationPresets.json` exists at `functions/src/default/evaluationPresets.json`

## Related Files

- `functions/src/new.ts` - Initialization functions
- `functions/src/default/evaluationPresets.json` - Preset definitions
- `functions/src/default/anamnesisFields.json` - Anamnesis field definitions
- `src/pages/user/EvaluationSettingsTab.tsx` - Frontend settings page
- `src/app/state/features/evaluationSlice.ts` - Redux slice for evaluation settings
