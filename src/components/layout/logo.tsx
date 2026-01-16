'use client';

import { cn } from '@/lib/utils';
import { defaultLogoBase64 } from '@/lib/logo';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export const Logo = ({ className, width = 20, height = 20 }: { className?: string; width?: number; height?: number }) => {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);

  useEffect(() => {
    // Ensure this runs only on the client
    try {
        const storedSettings = localStorage.getItem('companySettings');
        if (storedSettings) {
          const settings = JSON.parse(storedSettings);
          // Use logoUrl if it exists and is not an empty string, otherwise fallback
          setLogoSrc(settings.logoUrl || defaultLogoBase64);
        } else {
          setLogoSrc(defaultLogoBase64);
        }
    } catch (e) {
        // If localStorage is unavailable or there's a parsing error, use default
        setLogoSrc(defaultLogoBase64);
    }
  }, []);

  if (!logoSrc) {
    // Return a placeholder or null while loading from localStorage
    return <div style={{ width: `${width}px`, height: `${height}px` }} className={className} />;
  }

  return (
    <Image
      src={logoSrc}
      alt="Logo de la tienda"
      width={width}
      height={height}
      className={cn("object-contain", className)}
      // Using unoptimized because the src can be an external URL provided by the user.
      // This avoids having to configure next.config.js for every possible domain.
      unoptimized 
    />
  );
};
