'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, DollarSign, FileText, Users } from 'lucide-react';

import { LowStockCard } from '@/components/dashboard/low-stock-card';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { StatsCard } from '@/components/dashboard/stats-card';
import type { Invoice, Product } from '@/lib/types';

type DashboardSnapshot = {
  stats: {
    todayRevenue: number;
    todaySalesCount: number;
    newCustomersCount: number;
    pendingInvoicesCount: number;
    pendingInvoicesTotal: number;
  };
  recentSales: Invoice[];
  lowStockProducts: Product[];
  salesLast7Days: Invoice[];
};

export default function DashboardPagePostgres() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);

      try {
        const response = await fetch('/api/dashboard', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar el dashboard.');
        }

        const body = (await response.json()) as DashboardSnapshot;
        setSnapshot(body);
      } catch (error) {
        console.error('Error loading dashboard from Postgres:', error);
        setSnapshot(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const stats = snapshot?.stats ?? {
    todayRevenue: 0,
    todaySalesCount: 0,
    newCustomersCount: 0,
    pendingInvoicesCount: 0,
    pendingInvoicesTotal: 0,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatsCard
          title="Ingresos de Hoy"
          value={`$${stats.todayRevenue.toLocaleString('es-CO')}`}
          change={`${stats.todaySalesCount} ventas`}
          icon={DollarSign}
          isLoading={isLoading}
        />
        <StatsCard
          title="Facturas Pendientes"
          value={stats.pendingInvoicesCount.toString()}
          change={`Total: $${stats.pendingInvoicesTotal.toLocaleString('es-CO')}`}
          icon={FileText}
          isLoading={isLoading}
        />
        <StatsCard
          title="Nuevos Clientes Hoy"
          value={`+${stats.newCustomersCount}`}
          change="Clientes registrados hoy"
          icon={Users}
          isLoading={isLoading}
        />
        <StatsCard
          title="Productos con Bajo Stock"
          value={(snapshot?.lowStockProducts.length ?? 0).toString()}
          change="Necesitan reabastecimiento"
          icon={AlertTriangle}
          isLoading={isLoading}
        />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesChart invoices={snapshot?.salesLast7Days ?? []} isLoading={isLoading} />
        </div>
        <div className="space-y-4">
          <RecentSales recentInvoices={snapshot?.recentSales ?? []} isLoading={isLoading} />
          <LowStockCard lowStockProducts={snapshot?.lowStockProducts ?? []} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
