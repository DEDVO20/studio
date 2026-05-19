'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart, DollarSign, Download, FileText, ShoppingBag } from 'lucide-react';
import { addDays, format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import type { DateRange } from 'react-day-picker';
import type { UserOptions } from 'jspdf-autotable';

import { StatsCard } from '@/components/dashboard/stats-card';
import { DateRangePicker } from '@/components/reports/date-range-picker';
import { RecentSalesTable } from '@/components/reports/recent-sales-table';
import { SalesByDayChart } from '@/components/reports/sales-by-day-chart';
import { TopProductsTable } from '@/components/reports/top-products-table';
import { ProductFilter } from '@/components/reports/product-filter';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanySettings } from '@/hooks/use-company-settings';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, Product } from '@/lib/types';

type TopProduct = {
  name: string;
  unitsSold: number;
  revenue: number;
};

export default function SalesReportPagePostgres() {
  const router = useRouter();
  const { toast } = useToast();
  const companySettings = useCompanySettings();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(startOfDay(new Date()), -30),
    to: new Date(),
  });

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const response = await fetch('/api/products', {
          method: 'GET',
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('No se pudieron cargar los productos.');
        }
        const body = (await response.json()) as { products?: Product[] };
        if (isMounted) {
          setProducts(body.products ?? []);
        }
      } catch (error) {
        console.error('Error loading products for report:', error);
      }
    }
    void loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInvoices() {
      setIsLoading(true);

      try {
        const response = await fetch('/api/invoices', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar el reporte de ventas.');
        }

        const body = (await response.json()) as { invoices?: Invoice[] };

        if (isMounted) {
          setInvoices(body.invoices ?? []);
        }
      } catch (error) {
        console.error('Error loading invoices report:', error);
        if (isMounted) {
          setInvoices([]);
        }
        toast({
          variant: 'destructive',
          title: 'Error al cargar',
          description: 'No se pudo cargar la informacion de ventas.',
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInvoices();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const { filteredInvoices, displayInvoices, totalRevenue, avgTicket, totalSales, totalProductsSold, topProducts } =
    useMemo(() => {
      if (!dateRange?.from) {
        return {
          filteredInvoices: [] as Invoice[],
          displayInvoices: [] as Invoice[],
          totalRevenue: 0,
          avgTicket: 0,
          totalSales: 0,
          totalProductsSold: 0,
          topProducts: [] as TopProduct[],
        };
      }

      const from = startOfDay(dateRange.from);
      const to = dateRange.to
        ? addDays(startOfDay(dateRange.to), 1)
        : addDays(startOfDay(new Date()), 1);

      const baseFiltered = invoices.filter((invoice) => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoiceDate >= from && invoiceDate < to && invoice.status !== 'cancelled';
      });

      const filtered = selectedProductIds.length > 0
        ? baseFiltered.filter((invoice) =>
            invoice.items.some((item) => selectedProductIds.includes(item.productId))
          )
        : baseFiltered;

      const mappedInvoices = selectedProductIds.length > 0
        ? filtered.map((invoice) => {
            const filteredItems = invoice.items.filter((item) =>
              selectedProductIds.includes(item.productId)
            );
            const subtotalOfSelected = filteredItems.reduce((sum, item) => sum + item.subtotal, 0);
            return {
              ...invoice,
              items: filteredItems,
              total: subtotalOfSelected,
            };
          })
        : filtered;

      const revenue = mappedInvoices.reduce((acc, invoice) => acc + invoice.total, 0);
      const salesCount = mappedInvoices.length;
      const avg = salesCount > 0 ? revenue / salesCount : 0;
      const productsSold = mappedInvoices.reduce(
        (acc, invoice) => acc + invoice.items.reduce((sum, item) => sum + item.quantity, 0),
        0
      );

      const topProductsMap = mappedInvoices.reduce(
        (acc, invoice) => {
          invoice.items.forEach((item) => {
            if (!acc[item.productId]) {
              acc[item.productId] = { name: item.productName, unitsSold: 0, revenue: 0 };
            }

            acc[item.productId].unitsSold += item.quantity;
            acc[item.productId].revenue += item.subtotal;
          });

          return acc;
        },
        {} as Record<string, TopProduct>
      );

      const sortedFiltered = filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const sortedDisplay = mappedInvoices.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        filteredInvoices: sortedFiltered,
        displayInvoices: sortedDisplay,
        totalRevenue: revenue,
        avgTicket: avg,
        totalSales: salesCount,
        totalProductsSold: productsSold,
        topProducts: Object.values(topProductsMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5),
      };
    }, [dateRange, invoices, selectedProductIds]);

  const handleExportCsv = () => {
    if (displayInvoices.length === 0) {
      toast({ variant: 'destructive', title: 'No hay datos para exportar' });
      return;
    }

    const csvHeaders = [
      'ID Factura',
      'Numero Factura',
      'Cliente',
      'Fecha',
      'Subtotal',
      'Impuestos',
      'Descuento',
      'Total',
      'Estado',
    ];

    const csvRows = displayInvoices.map((invoice) =>
      [
        invoice.id,
        invoice.invoiceNumber,
        `"${invoice.customerName.replace(/"/g, '""')}"`,
        format(new Date(invoice.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        selectedProductIds.length > 0 ? invoice.total : invoice.subtotal,
        selectedProductIds.length > 0 ? 0 : invoice.tax,
        selectedProductIds.length > 0 ? 0 : invoice.discount,
        invoice.total,
        invoice.status,
      ].join(',')
    );

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte_ventas.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Exportacion CSV completa' });
  };

  const handleExportPdf = async () => {
    if (displayInvoices.length === 0) {
      toast({ variant: 'destructive', title: 'No hay datos para exportar' });
      return;
    }

    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF() as any;
    const dateRangeString = dateRange?.from
      ? `${format(dateRange.from, 'P', { locale: es })} - ${
          dateRange.to ? format(dateRange.to, 'P', { locale: es }) : 'Hoy'
        }`
      : 'Todo el tiempo';

    const productFilterText = selectedProductIds.length > 0
      ? `Productos filtrados: ${selectedProductIds.length}`
      : 'Todos los productos';

    doc.setFontSize(18);
    doc.text(`Reporte de Ventas - ${companySettings.name}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Periodo: ${dateRangeString} | ${productFilterText}`, 14, 30);

    doc.autoTable({
      startY: 40,
      head: [['Metrica', 'Valor']],
      body: [
        ['Ingresos Totales', `$${totalRevenue.toLocaleString('es-CO')}`],
        ['Ticket Promedio', `$${avgTicket.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`],
        ['Total de Ventas', totalSales.toString()],
        ['Productos Vendidos', totalProductsSold.toString()],
      ],
      theme: 'striped',
      styles: { fontSize: 10 },
    });

    if (topProducts.length > 0) {
      doc.autoTable({
        startY: (doc.lastAutoTable?.finalY ?? 40) + 10,
        head: [[selectedProductIds.length > 0 ? 'Productos Filtrados Vendidos' : 'Top 5 Productos Vendidos', 'Unidades', 'Ingresos']],
        body: topProducts.map((product) => [
          product.name,
          product.unitsSold,
          `$${product.revenue.toLocaleString('es-CO')}`,
        ]),
      });
    }

    doc.autoTable({
      startY: (doc.lastAutoTable?.finalY ?? 40) + 10,
      head: [['Ventas Recientes (hasta 10)', 'Cliente', 'Fecha', 'Total']],
      body: displayInvoices.slice(0, 10).map((invoice) => [
        invoice.invoiceNumber,
        invoice.customerName,
        format(new Date(invoice.createdAt), 'P', { locale: es }),
        `$${invoice.total.toLocaleString('es-CO')}`,
      ]),
    });

    doc.save('reporte_ventas.pdf');
    toast({ title: 'Exportacion PDF completa' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver</span>
              </Button>
              <div>
                <CardTitle>Reporte de Ventas</CardTitle>
                <CardDescription>Analiza el rendimiento de tus ventas por periodo.</CardDescription>
              </div>
            </div>
            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
              <ProductFilter products={products} selectedIds={selectedProductIds} onChange={setSelectedProductIds} className="w-full sm:w-auto" />
              <DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-full" />
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
          <StatsCard title="Ingresos Totales" value={`$${totalRevenue.toLocaleString('es-CO')}`} icon={DollarSign} isLoading={isLoading} />
          <StatsCard title="Ticket Promedio" value={`$${avgTicket.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`} icon={BarChart} isLoading={isLoading} />
          <StatsCard title="Total de Ventas" value={totalSales.toString()} icon={FileText} isLoading={isLoading} />
          <StatsCard title="Productos Vendidos" value={totalProductsSold.toString()} icon={ShoppingBag} isLoading={isLoading} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SalesByDayChart invoices={displayInvoices} isLoading={isLoading} />
        <TopProductsTable invoices={displayInvoices} isLoading={isLoading} />
      </div>

      <RecentSalesTable invoices={displayInvoices} isLoading={isLoading} />
    </div>
  );
}
