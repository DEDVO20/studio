export { default } from './sales-report-page-postgres';
/*

import { useMemo, useState } from 'react';
import { BarChart, DollarSign, FileText, ShoppingBag, Download, ArrowLeft } from "lucide-react";
import { DateRange } from 'react-day-picker';
import { addDays, startOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

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
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useCompanySettings } from '@/hooks/use-company-settings';
import type { UserOptions } from 'jspdf-autotable';

function LegacySalesReportPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const companySettings = useCompanySettings();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(startOfDay(new Date()), -30),
    to: new Date(),
  });

  // Fetch all invoices
  const invoicesRef = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const { data: invoicesData, isLoading } = useCollection<Invoice>(invoicesRef);

  const { filteredInvoices, totalRevenue, avgTicket, totalSales, totalProductsSold, topProducts } = useMemo(() => {
    if (!invoicesData || !dateRange?.from) {
        return { filteredInvoices: [], totalRevenue: 0, avgTicket: 0, totalSales: 0, totalProductsSold: 0, topProducts: [] };
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
    
    const topProductsMap = filtered.reduce((acc, invoice) => {
        invoice.items.forEach(item => {
            if (!acc[item.productId]) {
                acc[item.productId] = { name: item.productName, unitsSold: 0, revenue: 0 };
            }
            acc[item.productId].unitsSold += item.quantity;
            acc[item.productId].revenue += item.subtotal;
        });
        return acc;
    }, {} as Record<string, { name: string; unitsSold: number; revenue: number }>);
    
    const topProductsData = Object.values(topProductsMap).sort((a,b) => b.revenue - a.revenue).slice(0, 5);


    return { 
        filteredInvoices: filtered.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()),
        totalRevenue: revenue,
        avgTicket: avg,
        totalSales: salesCount,
        totalProductsSold: productsSold,
        topProducts: topProductsData,
    };
  }, [invoicesData, dateRange]);

  const handleExportCsv = () => {
    if (filteredInvoices.length === 0) {
        toast({ variant: 'destructive', title: 'No hay datos para exportar' });
        return;
    }

    const csvHeaders = [
        "ID Factura", "Número Factura", "Cliente", "Fecha", "Subtotal", "Impuestos", "Descuento", "Total", "Estado"
    ];
    const csvRows = filteredInvoices.map(i => [
        i.id,
        i.invoiceNumber,
        `"${i.customerName.replace(/"/g, '""')}"`,
        format(i.createdAt, 'yyyy-MM-dd HH:mm:ss'),
        i.subtotal,
        i.tax,
        i.discount,
        i.total,
        i.status,
    ].join(','));

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'reporte_ventas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exportación CSV Completa" });
  };

  const handleExportPdf = async () => {
      if (filteredInvoices.length === 0) {
        toast({ variant: 'destructive', title: 'No hay datos para exportar' });
        return;
      }

      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      interface jsPDFWithAutoTable extends jsPDF {
          autoTable: (options: UserOptions) => jsPDF;
      }
      const doc = new jsPDF() as jsPDFWithAutoTable;
      
      const dateRangeString = dateRange?.from
          ? `${format(dateRange.from, "P", { locale: es })} - ${dateRange.to ? format(dateRange.to, "P", { locale: es }) : 'Hoy'}`
          : "Todo el tiempo";

      // Header
      doc.setFontSize(18);
      doc.text(`Reporte de Ventas - ${companySettings.name}`, 14, 22);
      doc.setFontSize(11);
      doc.text(`Período: ${dateRangeString}`, 14, 30);

      // Summary Stats
      doc.autoTable({
          startY: 40,
          head: [['Métrica', 'Valor']],
          body: [
              ['Ingresos Totales', `$${totalRevenue.toLocaleString('es-CO')}`],
              ['Ticket Promedio', `$${avgTicket.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`],
              ['Total de Ventas', totalSales.toString()],
              ['Productos Vendidos', totalProductsSold.toString()],
          ],
          theme: 'striped',
          styles: { fontSize: 10 },
      });

      // Top Products table
      if (topProducts.length > 0) {
        doc.autoTable({
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Top 5 Productos Vendidos', 'Unidades', 'Ingresos']],
            body: topProducts.map(p => [
                p.name,
                p.unitsSold,
                `$${p.revenue.toLocaleString('es-CO')}`,
            ]),
        });
      }

      // Recent Sales table
      if (filteredInvoices.length > 0) {
        doc.autoTable({
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Ventas Recientes (hasta 10)', 'Cliente', 'Fecha', 'Total']],
            body: filteredInvoices.slice(0,10).map(i => [
                i.invoiceNumber,
                i.customerName,
                format(i.createdAt, 'P', { locale: es }),
                `$${i.total.toLocaleString('es-CO')}`,
            ]),
        });
      }
      
      doc.save('reporte_ventas.pdf');
      toast({ title: "Exportación PDF Completa" });
  };


  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Volver</span>
                        </Button>
                        <div>
                            <CardTitle>Reporte de Ventas</CardTitle>
                            <CardDescription>
                            Analiza el rendimiento de tus ventas en un período específico.
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <DateRangePicker 
                            date={dateRange}
                            onDateChange={setDateRange}
                            className="w-full"
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto">
                                    <Download className="mr-2 h-4 w-4" />
                                    Exportar
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExportCsv}>Exportar a CSV</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportPdf}>Exportar a PDF</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
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
                isLoading={isLoading}
                />
                <StatsCard
                title="Ticket Promedio"
                value={`$${avgTicket.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`}
                icon={BarChart}
                isLoading={isLoading}
                />
                <StatsCard
                title="Total de Ventas"
                value={totalSales.toString()}
                icon={FileText}
                isLoading={isLoading}
                />
                <StatsCard
                title="Productos Vendidos"
                value={totalProductsSold.toString()}
                icon={ShoppingBag}
                isLoading={isLoading}
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

*/
