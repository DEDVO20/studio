'use client';

import { useMemo } from 'react';
import { DollarSign, Package, PackageCheck, Archive, Download, ArrowLeft } from "lucide-react";
import { useRouter } from 'next/navigation';

import { StatsCard } from "@/components/dashboard/stats-card";
import { InventoryValueChart } from "@/components/reports/inventory-value-chart";
import { LowStockTable } from "@/components/reports/low-stock-table";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useCompanySettings } from '@/hooks/use-company-settings';
import type { UserOptions } from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


export default function InventoryReportPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const companySettings = useCompanySettings();

  const productsRef = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: productsData, isLoading } = useCollection<Product>(productsRef);

  const { products, totalInventoryValue, lowStockCount, lowStockProducts } = useMemo(() => {
    if (!productsData) {
        return { products: [], totalInventoryValue: 0, lowStockCount: 0, lowStockProducts: [] };
    }
    const prods = productsData.map(p => ({
        ...p,
        createdAt: (p.createdAt as any)?.toDate ? (p.createdAt as any).toDate() : new Date(),
        updatedAt: (p.updatedAt as any)?.toDate ? (p.updatedAt as any).toDate() : new Date(),
    }));

    const inventoryValue = prods.reduce((acc, p) => acc + (p.stock * p.cost), 0);
    const lowStock = prods.filter(p => p.stock <= p.minStock);
    
    return {
        products: prods,
        totalInventoryValue: inventoryValue,
        lowStockCount: lowStock.length,
        lowStockProducts: lowStock,
    };
  }, [productsData]);

  const handleExportCsv = () => {
    if (products.length === 0) {
        toast({ variant: 'destructive', title: 'No hay datos para exportar' });
        return;
    }

    const csvHeaders = ["ID", "Nombre", "SKU", "Categoría", "Stock Actual", "Stock Mínimo", "Costo", "Precio Venta", "Valor Total (Costo)"];
    const csvRows = products.map(p => [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        p.category,
        p.stock,
        p.minStock,
        p.cost,
        p.price,
        p.stock * p.cost,
    ].join(','));

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'reporte_inventario.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exportación CSV Completa" });
  };

  const handleExportPdf = async () => {
      if (products.length === 0) {
        toast({ variant: 'destructive', title: 'No hay datos para exportar' });
        return;
      }

      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      interface jsPDFWithAutoTable extends jsPDF {
          autoTable: (options: UserOptions) => jsPDF;
      }
      const doc = new jsPDF() as jsPDFWithAutoTable;
      
      const today = format(new Date(), "P", { locale: es });

      // Header
      doc.setFontSize(18);
      doc.text(`Reporte de Inventario - ${companySettings.name}`, 14, 22);
      doc.setFontSize(11);
      doc.text(`Generado el: ${today}`, 14, 30);

      // Summary Stats
      doc.autoTable({
          startY: 40,
          head: [['Métrica', 'Valor']],
          body: [
              ['Valor Total del Inventario', `$${totalInventoryValue.toLocaleString('es-CO')}`],
              ['Productos con Bajo Stock', lowStockCount.toString()],
              ['SKUs Totales', products.length.toString()],
          ],
          theme: 'striped',
          styles: { fontSize: 10 },
      });

      // Low Stock Table
      if (lowStockProducts.length > 0) {
        doc.autoTable({
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Productos con Bajo Stock', 'Categoría', 'Stock Actual', 'Stock Mínimo']],
            body: lowStockProducts.map(p => [
                p.name,
                p.category,
                p.stock,
                p.minStock,
            ]),
        });
      } else {
        doc.text("No hay productos con bajo stock.", 14, (doc as any).lastAutoTable.finalY + 10);
      }
      
      doc.save('reporte_inventario.pdf');
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
                            <CardTitle>Reporte de Inventario</CardTitle>
                            <CardDescription>
                            Obtén una visión detallada del estado y valor de tu stock.
                            </CardDescription>
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
                <StatsCard
                    title="Valor Total del Inventario"
                    value={`$${totalInventoryValue.toLocaleString('es-CO')}`}
                    change="Basado en el costo"
                    icon={DollarSign}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Productos con Bajo Stock"
                    value={lowStockCount.toString()}
                    change="Necesitan reabastecimiento"
                    icon={Package}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="SKUs Totales"
                    value={products.length.toString()}
                    change="Productos únicos en sistema"
                    icon={Archive}
                    isLoading={isLoading}
                />
                 <StatsCard
                    title="Precisión del Inventario"
                    value="N/A"
                    change="Último conteo físico"
                    icon={PackageCheck}
                    isLoading={isLoading}
                />
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
