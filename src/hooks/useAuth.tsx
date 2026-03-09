import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startNotificationScheduler, stopNotificationScheduler } from "@/lib/notificationScheduler";
import { startLocationChecker, stopLocationChecker } from "@/lib/locationChecker";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInAsGuest: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  /** Convert guest to full account, optionally migrating data */
  linkAccount: (email: string, password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_KEY = "remind-me-is-guest";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem(GUEST_KEY) === "true");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        // Check if this is an anonymous user
        const anon = session.user.is_anonymous === true;
        setIsGuest(anon);
        localStorage.setItem(GUEST_KEY, String(anon));
        startNotificationScheduler();
        startLocationChecker();
      } else {
        setIsGuest(false);
        localStorage.removeItem(GUEST_KEY);
        stopNotificationScheduler();
        stopLocationChecker();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInAsGuest = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    return { error };
  };

  const signOut = async () => {
    localStorage.removeItem(GUEST_KEY);
    await supabase.auth.signOut();
  };

  const linkAccount = async (email: string, password: string) => {
    // Converts anonymous user to a permanent account
    const { error } = await supabase.auth.updateUser({
      email,
      password,
    });
    if (!error) {
      setIsGuest(false);
      localStorage.removeItem(GUEST_KEY);
    }
    return { error };
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, isGuest, signUp, signIn, signInAsGuest, signOut, linkAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
