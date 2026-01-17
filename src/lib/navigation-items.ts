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
    Warehouse 
} from 'lucide-react';

export const navItems = [
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

export const settingsNavItem = { href: '/settings', label: 'Configuración', icon: Settings };
