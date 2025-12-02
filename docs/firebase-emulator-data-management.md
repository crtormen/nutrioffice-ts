# Firebase Emulator Data Management

This guide explains how to work with production data in your local Firebase emulators.

## Quick Start

Your emulators are already configured to persist data:

```bash
npm run emulate
```

This command:
- Imports data from `./emulator-data`
- Exports data back on exit

## Current Data Status

You have two data directories:

- **`emulator-data/`** - Active emulator data (used by `npm run emulate`)
- **`saved-data/`** - Backup/alternate dataset

Both contain:
- Auth exports (user accounts)
- Firestore exports (database documents)
- Storage exports (uploaded files)

## Importing Production Data

### Option 1: Using Firebase Console (Recommended for Small Datasets)

1. **Export from Firebase Console:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to Firestore Database → Import/Export
   - Click "Export" and select a Cloud Storage bucket
   - Wait for export to complete
   - Download the export from Cloud Storage

2. **Import to Emulator:**
   ```bash
   # Extract your download to ./production-export
   ./scripts/import-production-data.sh ./production-export

   # Start emulators with production data
   npm run emulate
   ```

### Option 2: Using gcloud CLI (For Larger Datasets)

1. **Install gcloud CLI:**
   ```bash
   # If not already installed
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   ```

2. **Export from production:**
   ```bash
   # Set your project ID
   export PROJECT_ID="your-project-id"

   # Create export
   gcloud firestore export gs://${PROJECT_ID}-exports/$(date +%Y%m%d) \
     --project=$PROJECT_ID

   # Download to local
   gsutil -m cp -r gs://${PROJECT_ID}-exports/$(date +%Y%m%d) ./production-export
   ```

3. **Import to emulator:**
   ```bash
   ./scripts/import-production-data.sh ./production-export
   npm run emulate
   ```

### Option 3: Manual Seed Script (For Specific Test Data)

If you just need specific test data, you can create a seed script:

```typescript
// scripts/seed-emulator.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  projectId: "demo-project",
  apiKey: "fake-api-key"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function seedData() {
  // Create test user
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    'test@example.com',
    'password123'
  );

  // Add test customer
  await addDoc(collection(db, `users/${userCredential.user.uid}/customers`), {
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '(11) 98765-4321',
    birthday: new Date('1990-01-01'),
    gender: 'M',
    createdAt: new Date()
  });

  console.log('✅ Seed data created');
}

seedData().catch(console.error);
```

Run with:
```bash
# Make sure emulators are running first
npm run emulate

# In another terminal
FIRESTORE_EMULATOR_HOST="localhost:8080" node scripts/seed-emulator.ts
```

## Working with Multiple Datasets

You can maintain different datasets for different scenarios:

```bash
# Save current state to a named backup
cp -r ./emulator-data ./datasets/customer-testing-scenario

# Load a specific dataset
cp -r ./datasets/customer-testing-scenario ./emulator-data
npm run emulate
```

## Resetting to Clean State

```bash
# Delete all emulator data
rm -rf ./emulator-data

# Start with empty emulators
npm run emulate
```

## Viewing Data in Emulator UI

While emulators are running:

- **Emulator Suite UI:** http://localhost:4000
- **Firestore Data:** http://localhost:4000/firestore
- **Auth Users:** http://localhost:4000/auth
- **Storage Files:** http://localhost:4000/storage

## Troubleshooting

### Data not loading
- Check `emulator-data/firebase-export-metadata.json` exists
- Verify folder structure matches:
  ```
  emulator-data/
    ├── firebase-export-metadata.json
    ├── auth_export/
    ├── firestore_export/
    └── storage_export/
  ```

### Emulator crashes on import
- Data may be from incompatible emulator version
- Try exporting fresh data from emulators:
  ```bash
  firebase emulators:export ./fresh-export
  ```

### Changes not persisting
- Make sure you're using `npm run emulate` (not `npm run serve`)
- `--export-on-exit` flag is required for persistence

## Best Practices

1. **Version control:** Add `emulator-data/` to `.gitignore` (sensitive data)
2. **Backups:** Regularly backup `emulator-data/` before major changes
3. **Seed scripts:** For consistent test data, use seed scripts instead of imports
4. **Clean state:** Start each testing session with known data state
5. **Documentation:** Document any custom datasets in `./datasets/README.md`
