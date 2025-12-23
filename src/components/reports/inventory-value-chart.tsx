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
import { mockProducts } from '@/lib/data';

// Aggregate inventory value by category
const inventoryByCategory = mockProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = 0;
    }
    acc[product.category] += product.stock * product.cost;
    return acc;
  }, {} as Record<string, number>);
  
const chartData = Object.entries(inventoryByCategory).map(([category, value]) => ({
    name: category,
    value: value,
})).sort((a, b) => b.value - a.value);


const chartConfig = {
  value: {
    label: 'Valor',
    color: 'hsl(var(--primary))',
  },
};

export function InventoryValueChart() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Valor de Inventario por Categoría</CardTitle>
        <CardDescription>
          Distribución del valor de tu stock actual (costo).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0, }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  width={80}
                />
                <XAxis 
                  type="number"
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8} 
                  tickFormatter={(value) => `$${Number(value) / 1000}k`} 
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={<ChartTooltipContent 
                    indicator="dot" 
                    formatter={(value) => `$${Number(value).toLocaleString('es-CO')}`}
                  />} 
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
