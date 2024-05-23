import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../firebaseConfig";
import { startSession } from "../../session";

export interface AuthProviderProps {
  children?: ReactNode;
}

interface AuthContextModel {
  loading: boolean;
  user: User | null;
  signin: (
    newUser: UserLoginInfo,
    successCallback: (res: UserCredential) => void,
    errorCallback: (message: string) => void
  ) => Promise<void>;
  signinWithGoogle: (
    successCallback: (res: UserCredential) => void,
    errorCallback: (message: string) => void
  ) => Promise<void>;
  signout: (callback: () => void) => Promise<void>;
  createAccount: (
    email: string,
    password: string,
    successCallback: (res: UserCredential) => void,
    errorCallback: (message: string) => void
  ) => Promise<void>;
}

export const AuthContext = createContext<AuthContextModel>(
  {} as AuthContextModel
);
AuthContext.displayName = "Authentication";

type UserLoginInfo = {
  email: string;
  password: string;
};

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  const authChanged = useCallback((firebaseUser: User | null) => {
    if (firebaseUser) setUser(firebaseUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, authChanged);
    return () => unsubscribe();
  }, [authChanged]);

  const signin = async (
    newUser: UserLoginInfo,
    successCallback: (res: UserCredential) => void,
    errorCallback: (message: string) => void
  ): Promise<void> => {
    setLoading(true);
    try {
      let res = await signInWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );
      if (res.user) {
        setUser(res.user);
        return successCallback(res);
      }

      return errorCallback("Wrong Credentials");
    } catch (error) {
      console.log(error);
      return errorCallback("Something went wrong");
    }
  };

  const signinWithGoogle = async (
    successCallback: (res: UserCredential) => void,
    errorCallback: (message: string) => void
  ): Promise<void> => {
    const googleProvider = new GoogleAuthProvider();

    setLoading(true);

    try {
      let res = await signInWithPopup(auth, googleProvider);

      const credential = GoogleAuthProvider.credentialFromResult(res);
      const token = credential?.accessToken;

      if (res.user) {
        setUser(res.user);
        startSession(res.user, token);
        return successCallback(res);
      }

      return errorCallback("Wrong Credentials");
    } catch (error: FirebaseError | any) {
      const credential = GoogleAuthProvider.credentialFromError(error);

      return errorCallback(
        `Something went wrong. Error: ${error.code} - ${error.message}`
      );
    }
  };

  const signout = async (callback: () => void) => {
    await signOut(auth);
    setUser(null);
    callback();
  };

  const createAccount = async (
    email: string,
    password: string,
    successCallback: (res: UserCredential) => void,
    errorCallback: (message: string) => void
  ): Promise<void> => {
    try {
      let res = await createUserWithEmailAndPassword(auth, email, password);
      if (res.user) return successCallback(res);
    } catch (error) {
      console.log(error);
      return errorCallback("Something went wrong");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        user,
        signin,
        signinWithGoogle,
        signout,
        createAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
