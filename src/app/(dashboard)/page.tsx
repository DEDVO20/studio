'use client';

import { DollarSign, Package, CreditCard, Users } from 'lucide-react';

import { LowStockCard } from '@/components/dashboard/low-stock-card';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { StatsCard } from '@/components/dashboard/stats-card';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatsCard
          title="Ingresos de Hoy"
          value="$1.842.500"
          change="+20.1% desde ayer"
          icon={DollarSign}
        />
        <StatsCard
          title="Ventas de Hoy"
          value="+12"
          change="+180.1% del último mes"
          icon={CreditCard}
        />
        <StatsCard
          title="Nuevos Clientes"
          value="+5"
          change="+5 desde ayer"
          icon={Users}
        />
        <StatsCard
          title="Facturas Pendientes"
          value="12"
          change="Total: $8.425.000"
          icon={Package}
        />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesChart />
        </div>
        <div className="space-y-4">
          <RecentSales />
          <LowStockCard />
        </div>
      </div>
    </div>
  );
}