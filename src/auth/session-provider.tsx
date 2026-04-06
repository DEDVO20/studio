'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { User } from '@/lib/types';

type AuthSessionContextValue = {
  profile: User | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  clearProfile: () => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(undefined);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.status === 401) {
        setProfile(null);
        return;
      }

      if (!response.ok) {
        throw new Error('No se pudo cargar la sesión.');
      }

      const body = (await response.json()) as { user: User };
      setProfile(body.user);
    } catch (error) {
      console.error('Error loading auth session:', error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      profile,
      isLoading,
      refreshProfile,
      clearProfile,
    }),
    [profile, isLoading, refreshProfile, clearProfile]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider.');
  }

  return context;
}
