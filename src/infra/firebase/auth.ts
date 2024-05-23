import {
  getAuth,
  onAuthStateChanged,
  User,
  signInAnonymously,
} from "firebase/auth";

export interface AuthProvider {
  isUserSignedIn: () => boolean;
  getUserId: () => string | undefined;
}

export class FirebaseAuthProvider implements AuthProvider {
  private isSignedIn: boolean = false;
  constructor() {}

  isUserSignedIn(): boolean {
    return this.isSignedIn;
  }

  getCurrentUser(): User | null {
    return getAuth().currentUser;
  }

  getUserId(): string | undefined {
    return getAuth().currentUser?.uid;
  }

  signInAnonymously(): Promise<any> {
    return signInAnonymously(getAuth());
  }
}

export let firebaseAuthProvider = new FirebaseAuthProvider();
