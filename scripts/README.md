# Scripts

Utility scripts for NutriOffice development.

## Available Scripts

### `manage-datasets.sh`

Manage multiple emulator data snapshots for different testing scenarios.

**Usage:**
```bash
./scripts/manage-datasets.sh <command> [name]
```

**Commands:**
- `save <name>` - Save current emulator data as named dataset
- `load <name>` - Load a saved dataset into emulator
- `list` - List all saved datasets with sizes and dates
- `delete <name>` - Delete a saved dataset
- `clean` - Delete current emulator data (start fresh)

**Examples:**
```bash
# Save current state for later
./scripts/manage-datasets.sh save customer-with-anamnesis

# List saved datasets
./scripts/manage-datasets.sh list

# Load a specific scenario
./scripts/manage-datasets.sh load customer-with-anamnesis

# Start fresh
./scripts/manage-datasets.sh clean
npm run emulate
```

**Use Cases:**
- Save different test scenarios (empty state, full data, edge cases)
- Switch between datasets for different features
- Keep clean baseline datasets for testing

---

### `download-firebase-export.sh`

Download Firestore export from Google Cloud Storage.

**Prerequisites:** Google Cloud SDK with `gsutil` installed

**Usage:**
```bash
./scripts/download-firebase-export.sh <project-id> [export-path]
```

**Examples:**
```bash
# Interactive mode (searches for exports)
./scripts/download-firebase-export.sh my-project-id

# Direct download with known path
./scripts/download-firebase-export.sh my-project-id gs://my-bucket/2025-01-29_export

# Find exports manually first
gsutil ls  # List buckets
gsutil ls gs://my-bucket/  # List exports in bucket
./scripts/download-firebase-export.sh my-project-id gs://my-bucket/path-to-export
```

**What it does:**
1. Validates gsutil is installed
2. Searches for exports in common bucket locations (if path not provided)
3. Downloads export to `./production-export`
4. Provides next steps for importing to emulator

---

### `create-emulator-user.sh`

Create a user in Firebase Auth Emulator with a specific UID (useful for accessing production user data).

**Prerequisites:** Emulators must be running (`npm run emulate`)

**Usage:**
```bash
./scripts/create-emulator-user.sh <uid> <email> [password]
```

**Examples:**
```bash
# Create user with production UID
./scripts/create-emulator-user.sh abc123xyz test@example.com mypassword

# Default password is "password123" if not specified
./scripts/create-emulator-user.sh abc123xyz test@example.com
```

**Use Case:**
When you import production Firestore data, you need a user with the same UID to access that data. This script creates an emulator user with the exact UID from your production user.

**Workflow:**
1. Find your production user's UID (from Firebase Console → Authentication)
2. Start emulators: `npm run emulate`
3. Create emulator user with that UID: `./scripts/create-emulator-user.sh <production-uid> dev@example.com`
4. Log in to your app with the email/password you specified
5. You can now access the production user's data at `users/<uid>/*`

---

### `import-production-data.sh`

Import production Firebase data into local emulators.

**Usage:**
```bash
./scripts/import-production-data.sh [path-to-export-folder]
```

**Default:** If no path is provided, looks for `./production-export`

**What it does:**
1. Backs up current `emulator-data/` to timestamped folder
2. Copies production export to `emulator-data/`
3. Ready to use with `npm run emulate`

**Example:**
```bash
# Download production export to ./my-export
# Then import it:
./scripts/import-production-data.sh ./my-export

# Optionally save it as a dataset
./scripts/manage-datasets.sh save production-snapshot-2025-01

# Start emulators with production data
npm run emulate
```

## Creating New Scripts

When adding new scripts:

1. Add them to this directory
2. Make them executable: `chmod +x scripts/your-script.sh`
3. Document them in this README
4. Use meaningful names and include usage instructions in comments
