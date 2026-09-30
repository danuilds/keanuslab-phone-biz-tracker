import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, firebaseEnabled } from "../lib/firebase";

export interface AppUser {
  uid: string;
  name: string;
  email?: string;
  photoURL?: string;
  demo: boolean;
  allowed: boolean;
  admin: boolean;
}

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  firebaseEnabled: boolean;
  signIn(): Promise<void>;
  startDemo(): void;
  signOut(): Promise<void>;
  recheckAccess(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);
const DEMO_SESSION_KEY = "phonebiz-demo-session";
const demoUser: AppUser = { uid: "demo", name: "Demo", demo: true, allowed: true, admin: false };

async function toAppUser(u: User): Promise<AppUser> {
  let allowed = false;
  let admin = false;
  if (db && u.email) {
    try {
      const entry = await getDoc(doc(db, "allowlist", u.email.toLowerCase()));
      allowed = entry.exists();
      admin = entry.data()?.admin === true;
    } catch {
      allowed = false;
    }
  }
  return { uid: u.uid, name: u.displayName || u.email || "You", email: u.email ?? undefined, photoURL: u.photoURL ?? undefined, demo: false, allowed, admin };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() =>
    localStorage.getItem(DEMO_SESSION_KEY) ? demoUser : null,
  );
  const [loading, setLoading] = useState(firebaseEnabled && !user);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setLoading(true);
        localStorage.removeItem(DEMO_SESSION_KEY);
        setUser(await toAppUser(u));
      } else {
        setUser((cur) => (cur?.demo ? cur : null));
      }
      setLoading(false);
    });
  }, []);

  const recheckAccess = useCallback(async () => {
    if (auth?.currentUser) setUser(await toAppUser(auth.currentUser));
  }, []);

  const value: AuthState = {
    user,
    loading,
    firebaseEnabled,
    recheckAccess,
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
