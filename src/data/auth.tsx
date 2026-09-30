import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { auth, firebaseEnabled } from "../lib/firebase";

export interface AppUser {
  uid: string;
  name: string;
  email?: string;
  photoURL?: string;
  demo: boolean;
}

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  firebaseEnabled: boolean;
  signIn(): Promise<void>;
  startDemo(): void;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);
const DEMO_SESSION_KEY = "phonebiz-demo-session";
const demoUser: AppUser = { uid: "demo", name: "Demo", demo: true };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() =>
    localStorage.getItem(DEMO_SESSION_KEY) ? demoUser : null,
  );
  const [loading, setLoading] = useState(firebaseEnabled && !user);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      if (u) {
        localStorage.removeItem(DEMO_SESSION_KEY);
        setUser({ uid: u.uid, name: u.displayName || u.email || "You", email: u.email ?? undefined, photoURL: u.photoURL ?? undefined, demo: false });
      } else {
        setUser((cur) => (cur?.demo ? cur : null));
      }
      setLoading(false);
    });
  }, []);

  const value: AuthState = {
    user,
    loading,
    firebaseEnabled,
    async signIn() {
      if (!auth) return;
      await signInWithPopup(auth, new GoogleAuthProvider());
    },
    startDemo() {
      localStorage.setItem(DEMO_SESSION_KEY, "1");
      setUser(demoUser);
    },
    async signOut() {
      if (user?.demo) {
        localStorage.removeItem(DEMO_SESSION_KEY);
        setUser(null);
      } else if (auth) {
        await fbSignOut(auth);
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
