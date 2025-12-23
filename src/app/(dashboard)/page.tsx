import {
  DollarSign,
  Package,
  CreditCard,
  Users,
} from 'lucide-react';

import { LowStockCard } from '@/components/dashboard/low-stock-card';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { StatsCard } from '@/components/dashboard/stats-card';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatsCard
          title="Today's Revenue"
          value="$1,842.50"
          change="+20.1% from yesterday"
          icon={DollarSign}
        />
        <StatsCard
          title="Today's Sales"
          value="+12"
          change="+180.1% from last month"
          icon={CreditCard}
        />
        <StatsCard
          title="New Customers"
          value="+5"
          change="+5 since yesterday"
          icon={Users}
        />
        <StatsCard
          title="Pending Invoices"
          value="12"
          change="Totaling $8,425.00"
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
