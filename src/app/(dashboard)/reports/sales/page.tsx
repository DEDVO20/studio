
'use client';

import { BarChart, DollarSign, FileText, ShoppingBag } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { SalesByDayChart } from "@/components/reports/sales-by-day-chart";
import { TopProductsTable } from "@/components/reports/top-products-table";
import { RecentSalesTable } from "@/components/reports/recent-sales-table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { DateRangePicker } from "@/components/reports/date-range-picker";


export default function SalesReportPage() {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Reporte de Ventas</CardTitle>
                    <CardDescription>
                    Analiza el rendimiento de tus ventas en un período específico.
                    </CardDescription>
                </div>
                <DateRangePicker />
            </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
            title="Ingresos Totales"
            value="$45.231.890"
            change="+20.1% vs mes anterior"
            icon={DollarSign}
            />
            <StatsCard
            title="Ticket Promedio"
            value="$87.500"
            change="+5.2% vs mes anterior"
            icon={BarChart}
            />
            <StatsCard
            title="Total de Ventas"
            value="517"
            change="+12.3% vs mes anterior"
            icon={FileText}
            />
            <StatsCard
            title="Productos Vendidos"
            value="1.245"
            change="+8.9% vs mes anterior"
            icon={ShoppingBag}
            />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesByDayChart />
            <TopProductsTable />
      </div>

      <RecentSalesTable />

    </div>
  );
}
