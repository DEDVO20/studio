'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { hasPermission } from '@/lib/roles';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isLoading } = useUserProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !profile) {
      // If loading is finished and there's still no profile, it means user is not logged in
      router.replace('/login');
    }
  }, [profile, isLoading, router]);

  useEffect(() => {
    if (profile && !isLoading) {
      if (!profile.isActive) {
         // In a real app, you might want to sign the user out here.
         router.replace('/login');
         return;
      }
      const canAccess = hasPermission(profile.role, pathname);
      if (!canAccess) {
        // If user tries to access a forbidden route, redirect to their main dashboard.
        router.replace('/');
      }
    }
  }, [profile, isLoading, pathname, router]);

  if (isLoading || !profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // While redirecting, show a loader to prevent brief flashing of forbidden content.
  if (!hasPermission(profile.role, pathname)) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
