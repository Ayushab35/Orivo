import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getAuthToken, setAuthToken } from './api';

export type User = {
  id: string;
  phone?: string;
  email?: string;
  name?: string;
  role?: string;
  businessName?: string;
  industry?: string;
  birth?: { date: string; time: string; placeName: string; lat?: number; lng?: number };
  tier?: string;
  referralCode?: string;
  onboarded?: boolean;
};

type AuthCtx = {
  ready: boolean;
  user: User | null;
  creditsBalanceSec: number;
  signInWithToken: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  ready: false,
  user: null,
  creditsBalanceSec: 0,
  signInWithToken: async () => {},
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [creditsBalanceSec, setBalance] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const t = await getAuthToken();
      if (!t) {
        setUser(null);
        setBalance(0);
        return;
      }
      const me = await api.get('/users/me');
      setUser(me.user);
      setBalance(me.creditsBalanceSec || 0);
    } catch {
      setUser(null);
      setBalance(0);
      await setAuthToken(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setReady(true);
    })();
  }, [refresh]);

  const signInWithToken = useCallback(
    async (token: string, u: User) => {
      await setAuthToken(token);
      setUser(u);
      await refresh();
    },
    [refresh]
  );

  const signOut = useCallback(async () => {
    await setAuthToken(null);
    setUser(null);
    setBalance(0);
  }, []);

  return (
    <Ctx.Provider value={{ ready, user, creditsBalanceSec, signInWithToken, signOut, refresh }}>{children}</Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
