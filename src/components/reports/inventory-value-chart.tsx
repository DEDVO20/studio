'use client';

import { useMemo } from 'react';
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
import { Skeleton } from '../ui/skeleton';
import type { Product } from '@/lib/types';


const chartConfig = {
  value: {
    label: 'Valor',
    color: 'hsl(var(--primary))',
  },
};

type InventoryValueChartProps = {
    products: Product[];
    isLoading: boolean;
}

export function InventoryValueChart({ products, isLoading }: InventoryValueChartProps) {

  const chartData = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Aggregate inventory value by category
    const inventoryByCategory = products.reduce((acc, product) => {
        if (!acc[product.category]) {
        acc[product.category] = 0;
        }
        acc[product.category] += product.stock * product.cost;
        return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(inventoryByCategory).map(([category, value]) => ({
        name: category,
        value: value,
    })).sort((a, b) => b.value - a.value);

  }, [products]);

  const renderContent = () => {
    if (isLoading) {
        return <Skeleton className="h-[300px] w-full" />;
    }

    if (chartData.length === 0) {
      return (
        <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
          No hay datos de inventario.
        </div>
      );
    }
    
    return (
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
    );
  }


  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Valor de Inventario por Categoría</CardTitle>
        <CardDescription>
          Distribución del valor de tu stock actual (costo).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
