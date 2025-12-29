/**
 * Script to manually initialize user settings for development/testing
 * This replicates what the onCreateFirestoreUserLoadDefaultSettings trigger does
 *
 * Usage:
 * 1. Make sure Firebase emulators are running
 * 2. Run: npx ts-node scripts/initializeUserSettings.ts <userId>
 *
 * Example:
 * npx ts-node scripts/initializeUserSettings.ts your-user-id-here
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  connectFirestoreEmulator
} from "firebase/firestore";

// Firebase config for emulator
const firebaseConfig = {
  projectId: "nutri-office",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator
connectFirestoreEmulator(db, "localhost", 8080);

async function initializeUserSettings(userId: string) {
  try {
    console.log(`🔄 Initializing settings for user: ${userId}`);

    // Get user document to check role
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error(`❌ User ${userId} not found in Firestore`);
      process.exit(1);
    }

    const userData = userSnap.data();
    const isProfessional = userData.roles?.ability === "PROFESSIONAL";

    console.log(`👤 User role: ${userData.roles?.ability || "UNKNOWN"}`);

    // Determine which default settings to load
    const settingsPath = isProfessional ? "settings/professional" : "settings/contributor";
    const settingsRef = doc(db, settingsPath);
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      console.error(`❌ Default settings not found at ${settingsPath}`);
      console.log(`💡 You may need to create default settings first`);
      process.exit(1);
    }

    const defaultSettings = settingsSnap.data();

    // Create user's default settings
    const userDefaultSettingsRef = doc(db, "users", userId, "settings", "default");
    await setDoc(userDefaultSettingsRef, defaultSettings);
    console.log(`✅ Created default settings for user`);

    // Create empty custom settings
    const userCustomSettingsRef = doc(db, "users", userId, "settings", "custom");
    await setDoc(userCustomSettingsRef, {});
    console.log(`✅ Created custom settings for user`);

    console.log(`\n🎉 Successfully initialized settings for user ${userId}`);
    console.log(`\nSettings loaded from: ${settingsPath}`);

    // Show anamnesis fields count
    if (defaultSettings.anamnesis) {
      const fieldCount = Object.keys(defaultSettings.anamnesis).length;
      console.log(`📋 Anamnesis fields loaded: ${fieldCount}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Error initializing settings:`, error);
    process.exit(1);
  }
}

// Get userId from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error("❌ Usage: npx ts-node scripts/initializeUserSettings.ts <userId>");
  console.error("Example: npx ts-node scripts/initializeUserSettings.ts abc123xyz");
  process.exit(1);
}

initializeUserSettings(userId);
