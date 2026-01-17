'use client';

import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format, startOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Invoice } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

const chartConfig = {
  sales: {
    label: 'Ventas',
    color: 'hsl(var(--primary))',
  },
};

type SalesChartProps = {
    invoices: Invoice[];
    isLoading: boolean;
};

export function SalesChart({ invoices, isLoading }: SalesChartProps) {
  const chartData = useMemo(() => {
    const last7Days: { date: string, sales: number }[] = [];
    const today = startOfDay(new Date());
    for (let i = 6; i >= 0; i--) {
        const day = subDays(today, i);
        last7Days.push({
            date: format(day, 'EEE', { locale: es }),
            sales: 0,
        });
    }

    invoices.forEach(invoice => {
        const invoiceDayStr = format(startOfDay(invoice.createdAt), 'EEE', { locale: es });
        const dayData = last7Days.find(d => d.date === invoiceDayStr);
        if (dayData) {
            dayData.sales += invoice.total;
        }
    });

    return last7Days;
  }, [invoices]);

  const renderContent = () => {
    if (isLoading) {
        return <Skeleton className="h-[250px] w-full" />;
    }

    return (
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer>
            <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={8} 
                    tickFormatter={(value) => {
                        if (value >= 1000000) return `$${Number(value) / 1000000}M`;
                        if (value >= 1000) return `$${Number(value) / 1000}k`;
                        return `$${value}`;
                    }}
                />
                <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent 
                        indicator="dot" 
                        formatter={(value) => `$${Number(value).toLocaleString('es-CO')}`}
                    />}
                />
                <Line
                    dataKey="sales"
                    type="monotone"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={true}
                />
            </LineChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas - Últimos 7 Días</CardTitle>
        <CardDescription>
          Un resumen del rendimiento de tus ventas en la última semana.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
