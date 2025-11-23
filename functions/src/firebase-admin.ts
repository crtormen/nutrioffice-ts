/**
 * Shared Firebase Admin initialization
 * This ensures Firebase Admin is initialized only once across all function modules
 */

import { initializeApp, cert, ServiceAccount, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

import serviceAccount from "./serviceAccount.json" with { type: "json" };

// Initialize Firebase Admin only if it hasn't been initialized yet
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
    databaseURL: "https://nutri-office.firebaseio.com",
  });
}

// Export shared instances
export const db = getFirestore();
export const auth = getAuth();
export const storage = getStorage();
