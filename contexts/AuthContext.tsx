// contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { firebaseAuth, firestoreDB } from "../services/firebase";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "@react-native-firebase/firestore";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { APP_CONFIG, GOOGLE_WEB_CLIENT_ID } from "../constants/config";
import { UserProfile } from "../types";

// Initialize Google Sign-In
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthContextValue extends AuthState {
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (
    updates: Partial<UserProfile>,
  ) => Promise<{ success: boolean; error?: string }>;
  refreshUserProfile: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ─── Default profile ──────────────────────────────────────────────────────────

function buildDefaultProfile(
  user: FirebaseAuthTypes.User,
): Omit<UserProfile, "uid"> {
  return {
    displayName: user.displayName ?? "User",
    email: user.email ?? "",
    emergencyContacts: [],
    decoyScreen: "calculator",
    stealthModeEnabled: false,
    appLockEnabled: false,
    biometricEnabled: false,
    autoLogoutMinutes: 5,
    childModeEnabled: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ─── Error parser ─────────────────────────────────────────────────────────────

function parseFirebaseError(code: string): string {
  const map: Record<string, string> = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests":
      "Too many failed attempts. Please try again later.",
    "auth/network-request-failed":
      "Network error. Please check your connection.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/invalid-credential": "Invalid credentials. Please try again.",
    "auth/operation-not-allowed": "This sign-in method is not enabled.",
    "auth/account-exists-with-different-credential":
      "An account already exists with this email using a different sign-in method.",
  };
  return map[code] ?? "An unexpected error occurred. Please try again.";
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    userProfile: null,
    isLoading: false,
    isInitialized: false,
  });

  // Fetch or create Firestore profile
  const fetchOrCreateProfile = useCallback(
    async (user: FirebaseAuthTypes.User): Promise<UserProfile | null> => {
      try {
        const userRef = doc(
          firestoreDB,
          APP_CONFIG.COLLECTIONS.USERS,
          user.uid,
        );
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          return snap.data() as UserProfile;
        }

        // Create new profile
        const newProfile: UserProfile = {
          uid: user.uid,
          ...buildDefaultProfile(user),
        };
        await setDoc(userRef, newProfile);
        return newProfile;
      } catch (err) {
        console.error("fetchOrCreateProfile error:", err);
        return null;
      }
    },
    [],
  );

  // Auth state listener
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      if (user) {
        const userProfile = await fetchOrCreateProfile(user);
        setState({
          user,
          userProfile,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        setState({
          user: null,
          userProfile: null,
          isLoading: false,
          isInitialized: true,
        });
      }
    });

    return unsubscribe;
  }, [fetchOrCreateProfile]);

  // ─── Auth methods ───────────────────────────────────────────────────────────

  const signInWithEmail = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        await firebaseAuth.signInWithEmailAndPassword(email.trim(), password);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: parseFirebaseError(err.code) };
      } finally {
        setState((s) => ({ ...s, isLoading: false }));
      }
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
    ): Promise<{ success: boolean; error?: string }> => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        const userCredential =
          await firebaseAuth.createUserWithEmailAndPassword(
            email.trim(),
            password,
          );
        await userCredential.user.updateProfile({
          displayName: displayName.trim(),
        });
        return { success: true };
      } catch (err: any) {
        return { success: false, error: parseFirebaseError(err.code) };
      } finally {
        setState((s) => ({ ...s, isLoading: false }));
      }
    },
    [],
  );

  const signInWithGoogle = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error("No ID token from Google");

      const googleCredential =
        firebaseAuth.GoogleAuthProvider.credential(idToken);
      await firebaseAuth.signInWithCredential(googleCredential);
      return { success: true };
    } catch (err: any) {
      console.error("Google Sign-In error:", err);
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, error: "Sign in cancelled." };
      }
      if (err.code === statusCodes.IN_PROGRESS) {
        return { success: false, error: "Sign in already in progress." };
      }
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          success: false,
          error: "Google Play Services not available.",
        };
      }
      return {
        success: false,
        error: "Google Sign-In failed. Please try again.",
      };
    } finally {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      // Try to sign out from Google if possible
      try {
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) {
          await GoogleSignin.signOut();
        }
      } catch (googleErr) {
        console.log("Google sign out error (can ignore):", googleErr);
      }

      // Sign out from Firebase
      await firebaseAuth.signOut();
    } catch (err) {
      console.error("signOut error:", err);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await signOut();
  }, [signOut]);

  const sendPasswordReset = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      try {
        await firebaseAuth.sendPasswordResetEmail(email.trim());
        return { success: true };
      } catch (err: any) {
        return { success: false, error: parseFirebaseError(err.code) };
      }
    },
    [],
  );

  const updateUserProfile = useCallback(
    async (
      updates: Partial<UserProfile>,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!state.user) return { success: false, error: "Not authenticated" };
      try {
        const userRef = doc(
          firestoreDB,
          APP_CONFIG.COLLECTIONS.USERS,
          state.user.uid,
        );
        const payload = { ...updates, updatedAt: Date.now() };
        await updateDoc(userRef, payload);
        setState((s) => ({
          ...s,
          userProfile: s.userProfile
            ? { ...s.userProfile, ...payload }
            : s.userProfile,
        }));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    [state.user],
  );

  const refreshUserProfile = useCallback(async (): Promise<void> => {
    if (!state.user) return;
    const userProfile = await fetchOrCreateProfile(state.user);
    setState((s) => ({ ...s, userProfile }));
  }, [state.user, fetchOrCreateProfile]);

  const deleteAccount = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!state.user) return { success: false, error: "Not authenticated" };
    try {
      // Delete Firestore data
      const userRef = doc(
        firestoreDB,
        APP_CONFIG.COLLECTIONS.USERS,
        state.user.uid,
      );
      await deleteDoc(userRef);
      // Delete Firebase Auth account
      await state.user.delete();
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error:
          err.code === "auth/requires-recent-login"
            ? "Please sign out and sign back in before deleting your account."
            : err.message,
      };
    }
  }, [state.user]);

  const value: AuthContextValue = {
    ...state,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    logout,
    sendPasswordReset,
    updateUserProfile,
    refreshUserProfile,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
