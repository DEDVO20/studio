'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // In a real app, you'd check for an authenticated user here.
    // For this demo, we'll just redirect to the dashboard.
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
        <p>Redirecting...</p>
    </div>
  );
}
