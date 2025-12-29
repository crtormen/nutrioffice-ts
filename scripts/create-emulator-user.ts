/**
 * Create a user in Firebase Auth Emulator with a specific UID
 * This allows you to access production user data in the emulator
 *
 * Usage:
 *   tsx scripts/create-emulator-user.ts <uid> <email> [password]
 *
 * Example:
 *   tsx scripts/create-emulator-user.ts abc123xyz test@example.com mypassword
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

// Emulator config
const firebaseConfig = {
  projectId: "demo-nutrioffice",
  apiKey: "fake-api-key-for-emulator"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

// Connect to emulators
connectAuthEmulator(auth, "http://localhost:9099");
connectFunctionsEmulator(functions, "localhost", 5001);

async function createUserWithCustomUID(
  targetUID: string,
  email: string,
  password: string = "password123"
) {
  try {
    console.log(`Creating user with UID: ${targetUID}`);
    console.log(`Email: ${email}`);

    // Note: Firebase client SDK cannot set custom UID directly
    // We need to use Admin SDK via a Cloud Function or REST API

    console.log('\n⚠️  Cannot set custom UID with client SDK');
    console.log('\nPlease use the bash script instead:\n');
    console.log('   ./scripts/create-emulator-user.sh ' + targetUID + ' ' + email + ' ' + password);
    console.log('\nOr use one of these manual methods:\n');

    console.log('1. Auth Emulator REST API (Recommended):');
    console.log(`   curl -X POST http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"email":"${email}","password":"${password}","localId":"${targetUID}"}'\n`);

    console.log('2. Modify exported auth data:');
    console.log('   - Stop emulators');
    console.log('   - Edit emulator-data/auth_export/accounts.json');
    console.log('   - Add user entry with your UID');
    console.log('   - Restart emulators\n');

    console.log('Note: The Firebase Emulator UI does not support setting custom UIDs directly.');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: tsx scripts/create-emulator-user.ts <uid> <email> [password]');
  console.log('Example: tsx scripts/create-emulator-user.ts abc123xyz test@example.com mypassword');
  process.exit(1);
}

const [uid, email, password] = args;

createUserWithCustomUID(uid, email, password || "password123");
