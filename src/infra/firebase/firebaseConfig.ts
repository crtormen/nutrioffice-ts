import { initializeApp, FirebaseApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { FirebaseStorage, getStorage } from "firebase/storage";
import {
  getFirestore,
  Firestore,
  collection,
  DocumentData,
  CollectionReference,
  query,
  onSnapshot,
} from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";

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

const app: FirebaseApp = initializeApp(config);
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

export const getAll = <T = DocumentData>(collection: CollectionReference) => {
  const querySnap = query(collection!);
  const allDocsSnap = onSnapshot(querySnap, (snapshot) => {
    console.log(snapshot);
    return snapshot.docs.map((doc) => ({
      id: doc.id, //append document id to each document
      ...doc.data(),
    }));
  });
  return allDocsSnap;
};

export default app;
