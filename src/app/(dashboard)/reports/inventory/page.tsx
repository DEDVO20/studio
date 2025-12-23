'use client';

import { DollarSign, Package, PackageCheck, Archive } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { InventoryValueChart } from "@/components/reports/inventory-value-chart";
import { LowStockTable } from "@/components/reports/low-stock-table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { mockProducts } from "@/lib/data";

const totalInventoryValue = mockProducts.reduce((acc, p) => acc + (p.stock * p.cost), 0);
const lowStockCount = mockProducts.filter(p => p.stock <= p.minStock).length;

export default function InventoryReportPage() {
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
                value={mockProducts.length.toString()}
                change="Productos únicos en sistema"
                icon={Archive}
            />
             <StatsCard
                title="Precisión del Inventario"
                value="98.5%"
                change="Último conteo físico"
                icon={PackageCheck}
            />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
                <InventoryValueChart />
            </div>
            <div className="lg:col-span-2">
                <LowStockTable />
            </div>
      </div>
    </div>
  );
}
