import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Role = 'user' | 'creator' | 'admin';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: Role;
  isCreator: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: 'user',
  isCreator: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadRole(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        (async () => { await loadRole(session.user.id); })();
      } else {
        setRole('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadRole(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    setRole((data?.role as Role) ?? 'user');
    setLoading(false);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole('user');
  };

  const isCreator = role === 'creator' || role === 'admin';

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, role, isCreator, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
