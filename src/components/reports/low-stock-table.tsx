'use client';

import { useMemo } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import {
      Table,
      TableBody,
      TableCell,
      TableHead,
      TableHeader,
      TableRow,
    } from '@/components/ui/table';
import type { Product } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

type LowStockTableProps = {
    products: Product[];
    isLoading: boolean;
};


export function LowStockTable({ products, isLoading }: LowStockTableProps) {
    const lowStockProducts = useMemo(() => {
        if (!products) return [];
        return products
            .filter(p => p.stock <= p.minStock)
            .sort((a,b) => (a.stock / a.minStock) - (b.stock / b.minStock));
    }, [products]);

    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                </TableRow>
            ));
        }

        if (lowStockProducts.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                        No hay productos con bajo stock.
                    </TableCell>
                </TableRow>
            );
        }

        return lowStockProducts.map((product) => (
            <TableRow key={product.id}>
                <TableCell className="font-medium">
                    <p>{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                </TableCell>
                <TableCell className="text-right">
                   <Badge variant="destructive">{product.stock}</Badge> / {product.minStock}
                </TableCell>
            </TableRow>
        ));
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Productos con Bajo Stock</CardTitle>
                <CardDescription>Estos productos requieren reabastecimiento prioritario.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Stock Actual</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {renderContent()}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
