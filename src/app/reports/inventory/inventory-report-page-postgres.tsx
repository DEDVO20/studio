'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Archive, DollarSign, Download, Package, PackageCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import type { UserOptions } from 'jspdf-autotable';

import { StatsCard } from '@/components/dashboard/stats-card';
import { InventoryValueChart } from '@/components/reports/inventory-value-chart';
import { LowStockTable } from '@/components/reports/low-stock-table';
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
import type { Product } from '@/lib/types';

export default function InventoryReportPagePostgres() {
  const router = useRouter();
  const { toast } = useToast();
  const companySettings = useCompanySettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);

      try {
        const response = await fetch('/api/products', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar el reporte de inventario.');
        }

        const body = (await response.json()) as { products?: Product[] };

        if (isMounted) {
          setProducts(body.products ?? []);
        }
      } catch (error) {
        console.error('Error loading inventory report:', error);
        if (isMounted) {
          setProducts([]);
        }
        toast({
          variant: 'destructive',
          title: 'Error al cargar',
          description: 'No se pudo cargar la informacion de inventario.',
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const { totalInventoryValue, lowStockCount, lowStockProducts } = useMemo(() => {
    const totalValue = products.reduce((acc, product) => acc + product.stock * product.cost, 0);
    const lowStock = products.filter((product) => product.stock <= product.minStock);

    return {
      totalInventoryValue: totalValue,
      lowStockCount: lowStock.length,
      lowStockProducts: lowStock,
    };
  }, [products]);

  const handleExportCsv = () => {
    if (products.length === 0) {
      toast({ variant: 'destructive', title: 'No hay datos para exportar' });
      return;
    }

    const csvHeaders = ['ID', 'Nombre', 'SKU', 'Categoria', 'Stock Actual', 'Stock Minimo', 'Costo', 'Precio Venta', 'Valor Total (Costo)'];
    const csvRows = products.map((product) =>
      [
        product.id,
        `"${product.name.replace(/"/g, '""')}"`,
        product.sku,
        product.category,
        product.stock,
        product.minStock,
        product.cost,
        product.price,
        product.stock * product.cost,
      ].join(',')
    );

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte_inventario.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Exportacion CSV completa' });
  };

  const handleExportPdf = async () => {
    if (products.length === 0) {
      toast({ variant: 'destructive', title: 'No hay datos para exportar' });
      return;
    }

    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF() as any;
    const today = format(new Date(), 'P', { locale: es });

    doc.setFontSize(18);
    doc.text(`Reporte de Inventario - ${companySettings.name}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generado el: ${today}`, 14, 30);

    doc.autoTable({
      startY: 40,
      head: [['Metrica', 'Valor']],
      body: [
        ['Valor Total del Inventario', `$${totalInventoryValue.toLocaleString('es-CO')}`],
        ['Productos con Bajo Stock', lowStockCount.toString()],
        ['SKUs Totales', products.length.toString()],
      ],
      theme: 'striped',
      styles: { fontSize: 10 },
    });

    if (lowStockProducts.length > 0) {
      doc.autoTable({
        startY: (doc.lastAutoTable?.finalY ?? 40) + 10,
        head: [['Productos con Bajo Stock', 'Categoria', 'Stock Actual', 'Stock Minimo']],
        body: lowStockProducts.map((product) => [
          product.name,
          product.category,
          product.stock,
          product.minStock,
        ]),
      });
    }

    doc.save('reporte_inventario.pdf');
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
                <CardTitle>Reporte de Inventario</CardTitle>
                <CardDescription>Obten una vista detallada del valor y estado del stock.</CardDescription>
              </div>
            </div>
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
          <StatsCard title="Valor Total del Inventario" value={`$${totalInventoryValue.toLocaleString('es-CO')}`} change="Basado en el costo" icon={DollarSign} isLoading={isLoading} />
          <StatsCard title="Productos con Bajo Stock" value={lowStockCount.toString()} change="Necesitan reabastecimiento" icon={Package} isLoading={isLoading} />
          <StatsCard title="SKUs Totales" value={products.length.toString()} change="Productos unicos en sistema" icon={Archive} isLoading={isLoading} />
          <StatsCard title="Precision del Inventario" value="N/A" change="Ultimo conteo fisico" icon={PackageCheck} isLoading={isLoading} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <InventoryValueChart products={products} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-2">
          <LowStockTable products={lowStockProducts} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
