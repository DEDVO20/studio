export { default } from './dashboard-page-postgres';
/*

import { DollarSign, FileText, Users, AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import { startOfDay, isSameDay, subDays } from 'date-fns';

import { LowStockCard } from '@/components/dashboard/low-stock-card';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Customer, Invoice, Product } from '@/lib/types';

function LegacyDashboardPage() {
    const firestore = useFirestore();

    const invoicesRef = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
    const { data: invoicesData, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesRef);

    const customersRef = useMemoFirebase(() => collection(firestore, 'customers'), [firestore]);
    const { data: customersData, isLoading: isLoadingCustomers } = useCollection<Customer>(customersRef);

    const productsRef = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
    const { data: productsData, isLoading: isLoadingProducts } = useCollection<Product>(productsRef);

    const invoices = useMemo<Invoice[]>(() => {
        if (!invoicesData) return [];
        return invoicesData.map(inv => ({
            ...inv,
            createdAt: (inv.createdAt as any)?.toDate ? (inv.createdAt as any).toDate() : new Date(),
            updatedAt: (inv.updatedAt as any)?.toDate ? (inv.updatedAt as any).toDate() : new Date(),
            dueDate: (inv.dueDate as any)?.toDate ? (inv.dueDate as any).toDate() : new Date(),
        }));
    }, [invoicesData]);

    const customers = useMemo<Customer[]>(() => {
        if (!customersData) return [];
        return customersData.map(c => ({
            ...c,
            createdAt: (c.createdAt as any)?.toDate ? (c.createdAt as any).toDate() : new Date(),
            updatedAt: (c.updatedAt as any)?.toDate ? (c.updatedAt as any).toDate() : new Date(),
        }));
    }, [customersData]);
    
    const products = useMemo<Product[]>(() => {
      if (!productsData) return [];
      return productsData;
    }, [productsData]);


    const { 
        todayRevenue, 
        todaySalesCount, 
        newCustomersCount, 
        pendingInvoicesCount, 
        pendingInvoicesTotal 
    } = useMemo(() => {
        const today = new Date();
        
        const todaysInvoices = invoices.filter(inv => isSameDay(inv.createdAt, today) && inv.status !== 'cancelled');
        const todaysRevenue = todaysInvoices.reduce((sum, inv) => sum + inv.total, 0);

        const newCustomers = customers.filter(c => isSameDay(c.createdAt, today));

        const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'partial');
        const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + inv.balance, 0);

        return {
            todayRevenue: todaysRevenue,
            todaySalesCount: todaysInvoices.length,
            newCustomersCount: newCustomers.length,
            pendingInvoicesCount: pendingInvoices.length,
            pendingInvoicesTotal: pendingTotal
        };
    }, [invoices, customers]);
    
    const recentSales = useMemo(() => {
        return invoices
            .filter(inv => inv.status !== 'cancelled')
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5);
    }, [invoices]);

    const lowStockProducts = useMemo(() => {
      return products.filter(p => p.stock <= p.minStock && p.isActive);
    }, [products]);

    const salesLast7Days = useMemo(() => {
      const today = startOfDay(new Date());
      const sevenDaysAgo = subDays(today, 6);
      return invoices.filter(inv => inv.createdAt >= sevenDaysAgo && inv.createdAt <= new Date() && inv.status !== 'cancelled');
    }, [invoices]);

    const isLoading = isLoadingInvoices || isLoadingCustomers || isLoadingProducts;

    return (
        <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <StatsCard
                title="Ingresos de Hoy"
                value={`$${todayRevenue.toLocaleString('es-CO')}`}
                change={`${todaySalesCount} ventas`}
                icon={DollarSign}
                isLoading={isLoading}
            />
            <StatsCard
                title="Facturas Pendientes"
                value={pendingInvoicesCount.toString()}
                change={`Total: $${pendingInvoicesTotal.toLocaleString('es-CO')}`}
                icon={FileText}
                isLoading={isLoading}
            />
             <StatsCard
                title="Nuevos Clientes Hoy"
                value={`+${newCustomersCount}`}
                change={`${customers.length} clientes en total`}
                icon={Users}
                isLoading={isLoading}
            />
            <StatsCard
                title="Productos con Bajo Stock"
                value={lowStockProducts.length.toString()}
                change="Necesitan reabastecimiento"
                icon={AlertTriangle}
                isLoading={isLoading}
            />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-2">
                <SalesChart invoices={salesLast7Days} isLoading={isLoading} />
            </div>
            <div className="space-y-4">
                <RecentSales recentInvoices={recentSales} isLoading={isLoading} />
                <LowStockCard lowStockProducts={lowStockProducts} isLoading={isLoading} />
            </div>
        </div>
        </div>
    );
}

*/
