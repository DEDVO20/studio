'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Logo } from './logo';
import { useCompanySettings } from '@/hooks/use-company-settings';
import { useUserProfile } from '@/hooks/use-user-profile';
import { hasPermission } from '@/lib/roles';
import { Skeleton } from '../ui/skeleton';
import { navItems, settingsNavItem } from '@/lib/navigation-items';

export function Sidebar() {
  const pathname = usePathname();
  const { name: companyName } = useCompanySettings();
  const { profile, isLoading } = useUserProfile();

  if (isLoading || !profile) {
    return (
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
             <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                <Skeleton className="h-9 w-9 rounded-full" />
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-8 rounded-lg" />)}
             </nav>
             <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
                <Skeleton className="h-8 w-8 rounded-lg" />
             </nav>
        </aside>
    );
  }

  const visibleMainNav = profile.role === 'admin' 
    ? navItems 
    : navItems.filter(item => hasPermission(profile.role, item.href));
  
  const canSeeSettings = hasPermission(profile.role, settingsNavItem.href);

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground overflow-hidden md:h-8 md:w-8 md:text-base"
        >
          <Logo className="h-full w-full transition-all group-hover:scale-110" />
          <span className="sr-only">{companyName}</span>
        </Link>
        <TooltipProvider>
          {visibleMainNav.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        {canSeeSettings && (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Link
                        href={settingsNavItem.href}
                        className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                        pathname === settingsNavItem.href ? 'bg-accent text-accent-foreground' : ''
                        )}
                    >
                        <settingsNavItem.icon className="h-5 w-5" />
                        <span className="sr-only">{settingsNavItem.label}</span>
                    </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{settingsNavItem.label}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )}
      </nav>
    </aside>
  );
}
