
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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

const chartData = [
  { date: 'Lun', sales: 1230000 },
  { date: 'Mar', sales: 1540000 },
  { date: 'Mié', sales: 1350000 },
  { date: 'Jue', sales: 1890000 },
  { date: 'Vie', sales: 2100000 },
  { date: 'Sáb', sales: 2500000 },
  { date: 'Dom', sales: 2350000 },
];

const chartConfig = {
  sales: {
    label: 'Ventas',
    color: 'hsl(var(--primary))',
  },
};

export function SalesByDayChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por Día</CardTitle>
        <CardDescription>
          Rendimiento de ventas durante la última semana.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0, }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8} 
                  tickFormatter={(value) => `$${Number(value) / 1000000}M`} 
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
      </CardContent>
    </Card>
  );
}
