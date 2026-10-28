import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserId = useRef<string | null>(null);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  };

  useEffect(() => {
    let active = true;

    // isLoading stays true until the admin role is known, so guarded pages
    // (e.g. /admin) don't redirect admins before the check finishes.
    const applySession = async (session: Session | null) => {
      currentUserId.current = session?.user?.id ?? null;
      setSession(session);
      setUser(session?.user ?? null);
      const admin = session?.user ? await checkAdminRole(session.user.id) : false;
      if (!active) return;
      setIsAdmin(admin);
      setIsLoading(false);
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'INITIAL_SESSION') return; // handled by getSession below
        // Token refreshes keep the same user; only a new user needs a fresh role check.
        if (session?.user && session.user.id !== currentUserId.current) setIsLoading(true);
        // Defer the role query with setTimeout to avoid a deadlock inside the auth callback
        setTimeout(() => {
          applySession(session);
        }, 0);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => applySession(session));

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Clear state immediately for responsive UI
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    
    // Then call the actual signOut (may fail if session already expired, that's ok)
    try {
      await supabase.auth.signOut();
    } catch {
      // Session may already have expired; local state is cleared above.
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}