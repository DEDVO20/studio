'use client';

import { useMemo, useState } from 'react';
import { BarChart, DollarSign, FileText, ShoppingBag } from "lucide-react";
import { DateRange } from 'react-day-picker';
import { addDays, startOfDay } from 'date-fns';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Invoice } from '@/lib/types';

import { StatsCard } from "@/components/dashboard/stats-card";
import { SalesByDayChart } from "@/components/reports/sales-by-day-chart";
import { TopProductsTable } from "@/components/reports/top-products-table";
import { RecentSalesTable } from "@/components/reports/recent-sales-table";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { Skeleton } from '@/components/ui/skeleton';

export default function SalesReportPage() {
  const firestore = useFirestore();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(startOfDay(new Date()), -30),
    to: new Date(),
  });

  // Fetch all invoices
  const invoicesRef = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const { data: invoicesData, isLoading } = useCollection<Invoice>(invoicesRef);

  const { filteredInvoices, totalRevenue, avgTicket, totalSales, totalProductsSold } = useMemo(() => {
    if (!invoicesData || !dateRange?.from) {
        return { filteredInvoices: [], totalRevenue: 0, avgTicket: 0, totalSales: 0, totalProductsSold: 0 };
    }

    const invoicesWithDates = invoicesData.map(inv => ({
      ...inv,
      createdAt: (inv.createdAt as any)?.toDate ? (inv.createdAt as any).toDate() : new Date(),
    }));

    const filtered = invoicesWithDates.filter(inv => {
        const invoiceDate = inv.createdAt;
        const from = startOfDay(dateRange.from!);
        // If 'to' is not set, use today. Add one day to 'to' to include the whole day.
        const to = dateRange.to ? addDays(startOfDay(dateRange.to), 1) : addDays(startOfDay(new Date()), 1);
        return invoiceDate >= from && invoiceDate < to && inv.status !== 'cancelled';
    });

    const revenue = filtered.reduce((acc, inv) => acc + inv.total, 0);
    const salesCount = filtered.length;
    const avg = salesCount > 0 ? revenue / salesCount : 0;
    const productsSold = filtered.reduce((acc, inv) => 
        acc + inv.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0);

    return { 
        filteredInvoices: filtered.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()),
        totalRevenue: revenue,
        avgTicket: avg,
        totalSales: salesCount,
        totalProductsSold: productsSold,
    };
  }, [invoicesData, dateRange]);


  return (
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <CardTitle>Reporte de Ventas</CardTitle>
                    <CardDescription>
                    Analiza el rendimiento de tus ventas en un período específico.
                    </CardDescription>
                </div>
                <DateRangePicker 
                    date={dateRange}
                    onDateChange={setDateRange}
                />
            </CardHeader>
        </Card>

        {isLoading ? (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
        ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                title="Ingresos Totales"
                value={`$${totalRevenue.toLocaleString('es-CO')}`}
                icon={DollarSign}
                />
                <StatsCard
                title="Ticket Promedio"
                value={`$${avgTicket.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`}
                icon={BarChart}
                />
                <StatsCard
                title="Total de Ventas"
                value={totalSales.toString()}
                icon={FileText}
                />
                <StatsCard
                title="Productos Vendidos"
                value={totalProductsSold.toString()}
                icon={ShoppingBag}
                />
            </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesByDayChart invoices={filteredInvoices} isLoading={isLoading} />
            <TopProductsTable invoices={filteredInvoices} isLoading={isLoading} />
      </div>

      <RecentSalesTable invoices={filteredInvoices} isLoading={isLoading} />

    </div>
  );
}
