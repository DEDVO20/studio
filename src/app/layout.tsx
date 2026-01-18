'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { hasPermission } from '@/lib/roles';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { profile, isLoading } = useUserProfile();
    const router = useRouter();
    const pathname = usePathname();
    const firestore = useFirestore();

    useEffect(() => {
        if (!isLoading && !profile) {
          router.replace('/login');
        }
      }, [profile, isLoading, router]);

    useEffect(() => {
        if (profile && !isLoading) {
          if (!profile.isActive) {
             router.replace('/login');
             return;
          }
          const canAccess = hasPermission(profile.role, pathname);
          if (!canAccess) {
            router.replace('/');
          }
        }
      }, [profile, isLoading, pathname, router]);

    useEffect(() => {
        if (profile?.role === 'admin' && firestore) {
          const statusDocRef = doc(firestore, 'system', 'status');
          getDoc(statusDocRef).then((docSnap) => {
            if (!docSnap.exists() || !docSnap.data().adminUserExists) {
              setDoc(statusDocRef, { adminUserExists: true }, { merge: true });
            }
          });
        }
      }, [profile, firestore]);
    
      if (isLoading || !profile) {
        return (
          <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
      }
      
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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="es" suppressHydrationWarning>
       <head>
        <title>BodegaStore</title>
        <meta name="description" content="Solución completa de Punto de Venta (POS) y Gestión de Tienda" />
      </head>
      <body className={cn('font-body antialiased', inter.variable)}>
        <FirebaseClientProvider>
          {isLoginPage ? children : <DashboardLayout>{children}</DashboardLayout>}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
