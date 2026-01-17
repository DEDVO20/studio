'use client';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { User as UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

export function useUserProfile() {
    const { user: authUser, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, 'users', authUser.uid);
    }, [firestore, authUser]);

    const { data: profile, isLoading: isProfileLoading, error } = useDoc<UserProfile>(userProfileRef);
    
    // In case the user document is not yet created for a newly authenticated user,
    // we can return a default minimal profile based on the auth user.
    if (!isAuthLoading && !isProfileLoading && authUser && !profile) {
        return {
            profile: {
                id: authUser.uid,
                email: authUser.email || '',
                displayName: authUser.displayName || 'Usuario',
                role: 'seller', // Default to least privileged role
                photoURL: authUser.photoURL || '',
                isActive: false, // Not fully active until DB record exists
                createdAt: new Date(),
                lastLogin: new Date(),
            } as UserProfile,
            isLoading: false
        };
    }
    
    return {
        profile,
        isLoading: isAuthLoading || isProfileLoading,
    };
}
