import { FirebaseError } from "firebase/app";
import {
  AuthError,
  createUserWithEmailAndPassword,
  // getAuth,
  GoogleAuthProvider,
  OAuthCredential,
  onAuthStateChanged,
  // RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { startSession } from "../../session";
import { auth } from "../firebaseConfig";

type UserLoginInfo = {
  email: string;
  password: string;
};

export interface AuthProviderProps {
  children?: ReactNode;
}

interface AuthContextModel {
  loading: boolean;
  user: User | null;
  dbUid: string;
  signin: (
    newUser: UserLoginInfo,
    successCallback: (res: UserCredential) => void,
    errorCallback: (error: AuthError) => void,
  ) => Promise<void>;
  signinWithGoogle: (
    successCallback: (res: UserCredential) => void,
    errorCallback: (
      error: AuthError,
      credential?: OAuthCredential | null,
    ) => void,
  ) => Promise<void>;
  signout: (callback: () => void) => Promise<void>;
  createAccount: (
    email: string,
    password: string,
    successCallback: (res: UserCredential) => void,
    errorCallback: (error: AuthError) => void,
  ) => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextModel>(
  {} as AuthContextModel,
);
AuthContext.displayName = "Authentication";

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [dbUid, setDbUid] = useState("");

  const authChanged = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser) {
      setUser(firebaseUser);
      const token = await firebaseUser.getIdTokenResult();
      setDbUid((token.claims.contributesTo as string) || firebaseUser.uid);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, authChanged);
    return () => unsubscribe();
  }, [authChanged]);

  const signin = useCallback(
    async (
      newUser: UserLoginInfo,
      successCallback: (res: UserCredential) => void,
      errorCallback: (error: AuthError) => void,
    ): Promise<void> => {
      setLoading(true);
      try {
        const res = await signInWithEmailAndPassword(
          auth,
          newUser.email,
          newUser.password,
        );
        return successCallback(res);
      } catch (error: unknown) {
        console.log(error);
        setLoading(false);
        return errorCallback(error as AuthError);
      }
    },
    [],
  );

  const signinWithGoogle = useCallback(
    async (
      successCallback: (res: UserCredential) => void,
      errorCallback: (
        error: AuthError,
        credential: OAuthCredential | null,
      ) => void,
    ): Promise<void> => {
      const googleProvider = new GoogleAuthProvider();

      setLoading(true);

      try {
        const res = await signInWithPopup(auth, googleProvider);

        const credential = GoogleAuthProvider.credentialFromResult(res);
        const token = credential?.accessToken;

        if (res.user) {
          // setUser(res.user);
          startSession(res.user, token);
        }
        return successCallback(res);
      } catch (error: unknown) {
        const credential = GoogleAuthProvider.credentialFromError(
          error as FirebaseError,
        );
        setLoading(false);
        return errorCallback(error as AuthError, credential);
      }
    },
    [],
  );

  const signout = useCallback(async (callback: () => void) => {
    await signOut(auth);
    callback();
  }, []);

  const createAccount = useCallback(
    async (
      email: string,
      password: string,
      successCallback?: (res: UserCredential) => void,
      errorCallback?: (error: AuthError) => void,
    ): Promise<void> => {
      try {
        setLoading(true);
        const res = await createUserWithEmailAndPassword(auth, email, password);
        setLoading(false);
        if (res.user) {
          return successCallback && successCallback(res);
        }
      } catch (error: unknown) {
        console.error(error);
        setLoading(false);
        return errorCallback && errorCallback(error as AuthError);
      }
    },
    [],
  );

  const refreshToken = useCallback(async (): Promise<void> => {
    if (!user) {
      console.warn("Cannot refresh token: no user logged in");
      return;
    }

    try {
      // Force refresh the token and get new custom claims
      await user.getIdToken(true);
      const tokenResult = await user.getIdTokenResult();

      // Update dbUid with new custom claims
      setDbUid((tokenResult.claims.contributesTo as string) || user.uid);
      console.log("Token refreshed successfully");
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  }, [user]);

  const contextValue = useMemo(
    () => ({
      loading,
      user,
      dbUid,
      signin,
      signinWithGoogle,
      signout,
      createAccount,
      refreshToken,
    }),
    [
      loading,
      user,
      dbUid,
      signin,
      signinWithGoogle,
      signout,
      createAccount,
      refreshToken,
    ],
  );

  // const recaptchaVerifier = new RecaptchaVerifier(
  //   auth,
  //   "recaptcha-container",

  //   // Optional reCAPTCHA parameters.
  //   {
  //     size: "normal",
  //     callback: function (response) {
  //       console.log(response);
  //       // reCAPTCHA solved, you can proceed with
  //       // phoneAuthProvider.verifyPhoneNumber(...).
  //       // onSolvedRecaptcha();
  //     },
  //     "expired-callback": function () {
  //       // Response expired. Ask user to solve reCAPTCHA again.
  //       // ...
  //     },
  //   },
  //   auth,
  // );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
