
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format, startOfDay } from 'date-fns';
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

type SalesByDayChartProps = {
  invoices: Invoice[];
  isLoading: boolean;
};

export function SalesByDayChart({ invoices, isLoading }: SalesByDayChartProps) {
  
  const chartData = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    
    const salesByDay: Record<string, number> = {};

    invoices.forEach(invoice => {
        const day = format(startOfDay(invoice.createdAt), 'yyyy-MM-dd');
        if (!salesByDay[day]) {
            salesByDay[day] = 0;
        }
        salesByDay[day] += invoice.total;
    });

    return Object.entries(salesByDay)
        .map(([date, sales]) => ({ date: format(new Date(date), 'MMM d', { locale: es }), sales }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [invoices]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[250px] w-full" />;
    }

    if (chartData.length === 0) {
      return (
        <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">
          No hay datos de ventas para este período.
        </div>
      );
    }
    
    return (
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
              <Bar dataKey="sales" fill="hsl(var(--primary))" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por Día</CardTitle>
        <CardDescription>
          Rendimiento de ventas durante el período seleccionado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
