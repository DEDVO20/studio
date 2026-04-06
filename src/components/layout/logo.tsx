'use client';

import Image from 'next/image';
import { useCompanySettings } from '@/hooks/use-company-settings';
import { defaultLogoBase64 } from '@/lib/logo';
import { cn } from '@/lib/utils';

export const Logo = ({ className, width = 20, height = 20 }: { className?: string; width?: number; height?: number }) => {
  const { logoUrl } = useCompanySettings();
  const logoSrc = logoUrl || defaultLogoBase64;

  return (
    <Image
      src={logoSrc}
      alt="Logo de la tienda"
      width={width}
      height={height}
      className={cn("object-cover", className)}
      unoptimized
    />
  );
};
