import { initializeApp, FirebaseApp } from "firebase/app";
import {
  Auth,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";
import {
  FirebaseStorage,
  connectStorageEmulator,
  getStorage,
} from "firebase/storage";
import {
  getFirestore,
  collection,
  Firestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import {
  getFunctions,
  Functions,
  connectFunctionsEmulator,
} from "firebase/functions";
import { AuthProvider, firebaseAuthProvider } from "./auth";

// const config = {
//   apiKey: import.meta.env.VITE_API_KEY,
//   authDomain: import.meta.env.VITE_AUTH_DOMAIN,
//   databaseURL: import.meta.env.VITE_DATABASE_URL,
//   projectId: import.meta.env.VITE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_APP_ID,
//   measurementId: import.meta.env.VITE_MEASUREMENT_ID,
// };
const config = {
  apiKey: "AIzaSyAqnrs2piR58ugTyixPVkEr9TscLbwX0wc",
  authDomain: "nutri-office.firebaseapp.com",
  databaseURL: "https://nutri-office.firebaseio.com",
  projectId: "nutri-office",
  storageBucket: "nutri-office.appspot.com",
  messagingSenderId: "164422277749",
  appId: "1:164422277749:web:0724b789152ff189",
  measurementId: "G-6JWEFJKCMJ",
};

// const useEmulator = () => import.meta.env.VITE_USE_FIREBASE_EMULATOR;

interface Server {}

export interface FirebaseServerProps {
  authProvider: AuthProvider;
}

export class FirebaseServer implements Server {
  private static instance: FirebaseServer; // Singleton
  private db!: Firestore;
  private auth!: Auth;
  private storage!: FirebaseStorage;
  private functions!: Functions;

  static getInstance(): Server {
    if (!FirebaseServer.instance) {
      console.error("Fatal error. Firebase app not initialized.");
    }

    return FirebaseServer.instance;
  }

  static init() {
    if (!FirebaseServer.instance) {
      FirebaseServer.instance = new FirebaseServer(); //init singleton

      const app: FirebaseApp = initializeApp(config);
      FirebaseServer.instance.db = getFirestore(app);
      FirebaseServer.instance.auth = getAuth(app);
      FirebaseServer.instance.functions = getFunctions(app);
      FirebaseServer.instance.storage = getStorage(app);

      if (location.hostname === "localhost") {
        connectFirestoreEmulator(FirebaseServer.instance.db, "localhost", 8080);
        connectAuthEmulator(FirebaseServer.instance.auth, "localhost:9099");
        connectStorageEmulator(
          FirebaseServer.instance.storage,
          "localhost",
          9199
        );
        connectFunctionsEmulator(
          FirebaseServer.instance.functions,
          "localhost",
          5001
        );
        console.log("Emulator connected");
      }
    } else {
      console.error(
        "FATAL ERROR: You should only call init() once, because this is a singleton."
      );
    }
  }

  // save(data): Promise<string> {
  //   return Promise.resolve("ok");
  // }
}
