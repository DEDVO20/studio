'use client';

import { TrendingUp } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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
  { date: 'Día 1', sales: 1230 },
  { date: 'Día 2', sales: 1540 },
  { date: 'Día 3', sales: 1350 },
  { date: 'Día 4', sales: 1890 },
  { date: 'Día 5', sales: 2100 },
  { date: 'Día 6', sales: 2500 },
  { date: 'Día 7', sales: 2350 },
];

const chartConfig = {
  sales: {
    label: 'Ventas',
    color: 'hsl(var(--primary))',
  },
};

export function SalesChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas - Últimos 7 Días</CardTitle>
        <CardDescription>
          Un resumen del rendimiento de tus ventas en la última semana.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
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
      </CardContent>
    </Card>
  );
}
