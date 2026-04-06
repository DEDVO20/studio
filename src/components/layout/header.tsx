'use client';

import React, { useState } from 'react';
import {
  LogOut,
  Menu,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Logo } from './logo';
import { useCompanySettings } from '@/hooks/use-company-settings';
import { useUserProfile } from '@/hooks/use-user-profile';
import { hasPermission } from '@/lib/roles';
import { navItems as allNavItems, settingsNavItem } from '@/lib/navigation-items';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, clearProfile } = useUserProfile();
  const { name: companyName } = useCompanySettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pathSegments = pathname.split('/').filter(Boolean);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearProfile();
    router.push('/login');
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const visibleMainNav = profile?.role ? (profile.role === 'admin' ? allNavItems : allNavItems.filter(item => hasPermission(profile.role, item.href))) : [];
  const canSeeSettings = profile?.role ? hasPermission(profile.role, settingsNavItem.href) : false;

  const getBreadcrumbLabel = (fullPath: string) => {
    const allItems = [...allNavItems, settingsNavItem];
    const item = allItems.find(i => i.href === fullPath);
    const segment = fullPath.split('/').pop() || '';
    return item?.label || segment;
  };


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir Menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <SheetTitle className="sr-only">Menú Principal</SheetTitle>
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground overflow-hidden"
              onClick={handleLinkClick}
            >
              <Logo className="h-full w-full transition-all group-hover:scale-110" />
              <span className="sr-only">{companyName}</span>
            </Link>
            {visibleMainNav.map(item => (
                <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                    onClick={handleLinkClick}
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </Link>
            ))}
            {canSeeSettings && (
                <Link
                    href={settingsNavItem.href}
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                    onClick={handleLinkClick}
                >
                    <settingsNavItem.icon className="h-5 w-5" />
                    {settingsNavItem.label}
                </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Inicio</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathSegments.map((segment, index) => {
            const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
            const isLast = index === pathSegments.length - 1;
            const label = getBreadcrumbLabel(href);
            
            if (profile && !hasPermission(profile.role, href)) {
                return null;
            }

            return (
              <React.Fragment key={href}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="capitalize">{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={href} className="capitalize">{label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar..."
          className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[336px]"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <Avatar>
              <AvatarImage src={profile?.photoURL ?? undefined} alt={profile?.displayName ?? 'Usuario'} />
              <AvatarFallback>{profile?.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{profile?.displayName ?? 'Mi Cuenta'}</DropdownMenuLabel>
          <DropdownMenuSeparator />
           {canSeeSettings && (
             <DropdownMenuItem asChild>
                <Link href="/settings">Configuración</Link>
             </DropdownMenuItem>
           )}
          <DropdownMenuItem>Soporte</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
