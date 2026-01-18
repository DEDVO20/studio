'use client';

import { useMemo } from 'react';
import { DollarSign, Package, PackageCheck, Archive } from "lucide-react";
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

export default function InventoryReportPage() {
  const firestore = useFirestore();

  const productsRef = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: productsData, isLoading } = useCollection<Product>(productsRef);

  const { products, totalInventoryValue, lowStockCount } = useMemo(() => {
    if (!productsData) {
        return { products: [], totalInventoryValue: 0, lowStockCount: 0 };
    }
    const prods = productsData.map(p => ({
        ...p,
        createdAt: (p.createdAt as any)?.toDate ? (p.createdAt as any).toDate() : new Date(),
        updatedAt: (p.updatedAt as any)?.toDate ? (p.updatedAt as any).toDate() : new Date(),
    }));

    const inventoryValue = prods.reduce((acc, p) => acc + (p.stock * p.cost), 0);
    const lowStock = prods.filter(p => p.stock <= p.minStock).length;
    
    return {
        products: prods,
        totalInventoryValue: inventoryValue,
        lowStockCount: lowStock,
    };
  }, [productsData]);


  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <div>
                    <CardTitle>Reporte de Inventario</CardTitle>
                    <CardDescription>
                    Obtén una visión detallada del estado y valor de tu stock.
                    </CardDescription>
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
                />
                <StatsCard
                    title="Productos con Bajo Stock"
                    value={lowStockCount.toString()}
                    change="Necesitan reabastecimiento"
                    icon={Package}
                />
                <StatsCard
                    title="SKUs Totales"
                    value={products.length.toString()}
                    change="Productos únicos en sistema"
                    icon={Archive}
                />
                 <StatsCard
                    title="Precisión del Inventario"
                    value="N/A"
                    change="Último conteo físico"
                    icon={PackageCheck}
                />
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
                <InventoryValueChart products={products} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-2">
                <LowStockTable products={products} isLoading={isLoading} />
            </div>
      </div>
    </div>
  );
}
