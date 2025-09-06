import {
  getAuth,
  signInAnonymously,
  User,
  UserCredential,
} from "firebase/auth";

export interface AuthProvider {
  isUserSignedIn: () => boolean;
  getUserId: () => string | undefined;
}

export class FirebaseAuthProvider implements AuthProvider {
  private isSignedIn: boolean = false;
  // constructor() {}

  isUserSignedIn(): boolean {
    return this.isSignedIn;
  }

  getCurrentUser(): User | null {
    return getAuth().currentUser;
  }

  getUserId(): string | undefined {
    return getAuth().currentUser?.uid;
  }

  signInAnonymously(): Promise<UserCredential> {
    return signInAnonymously(getAuth());
  }
}

export const firebaseAuthProvider = new FirebaseAuthProvider();
