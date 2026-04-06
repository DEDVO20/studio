'use client';

import { useAuthSession } from '@/auth/session-provider';

export function useUserProfile() {
  const { profile, isLoading, refreshProfile, clearProfile } = useAuthSession();

  return {
    profile,
    isLoading,
    refreshProfile,
    clearProfile,
  };
}
