import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth, connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  Firestore,
  getFirestore,
} from "firebase/firestore";
import {
  connectFunctionsEmulator,
  Functions,
  getFunctions,
  httpsCallable,
} from "firebase/functions";
import {
  // connectStorageEmulator,
  FirebaseStorage,
  getStorage,
} from "firebase/storage";

// import { env } from "@/env";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_DATABASE_URL,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

// const config = {
//   apiKey: env.VITE_FIREBASE_API_KEY,
//   authDomain: env.VITE_AUTH_DOMAIN,
//   databaseURL: env.VITE_DATABASE_URL,
//   projectId: env.VITE_PROJECT_ID,
//   storageBucket: env.VITE_STORAGE_BUCKET,
//   messagingSenderId: env.VITE_MESSAGING_SENDER_ID,
//   appId: env.VITE_APP_ID,
//   measurementId: env.VITE_MEASUREMENT_ID,
// };

const app: FirebaseApp = initializeApp(config);
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

export const createAuthUser = httpsCallable(functions, "createAuthUser");
export const reloadDefaultSettingsToUser = httpsCallable(
  functions,
  "reloadDefaultSettingsToUser",
);

if (location.hostname === "localhost") {
  connectFirestoreEmulator(db, "localhost", 8080);
  connectAuthEmulator(auth, "http://localhost:9099");
  // connectStorageEmulator(storage, "localhost", 9199);
  connectFunctionsEmulator(functions, "localhost", 5001);
  console.log("Emulator connected");
}

export default app;
