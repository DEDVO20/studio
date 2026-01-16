'use client';

import {
  BarChart3,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  UserCog,
  Users,
  Warehouse,
} from 'lucide-react';
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

const navItems = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/pos', label: 'POS', icon: ShoppingCart },
  { href: '/invoices', label: 'Facturas', icon: FileText },
  { href: '/products', label: 'Productos', icon: Package },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/inventory', label: 'Inventario', icon: Warehouse },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/expenses', label: 'Gastos', icon: CircleDollarSign },
  { href: '/users', label: 'Usuarios', icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Logo className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">NexusStore</span>
        </Link>
        <TooltipProvider>
          {navItems.map((item) => (
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                  pathname === '/settings' ? 'bg-accent text-accent-foreground' : ''
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Configuración</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Configuración</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
