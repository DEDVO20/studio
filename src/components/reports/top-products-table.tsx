
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
import type { Invoice } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

type TopProductsTableProps = {
    invoices: Invoice[];
    isLoading: boolean;
};

export function TopProductsTable({ invoices, isLoading }: TopProductsTableProps) {
    const topProducts = useMemo(() => {
        const productSales: Record<string, { name: string; unitsSold: number; revenue: number }> = {};

        invoices.forEach(invoice => {
            invoice.items.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        name: item.productName,
                        unitsSold: 0,
                        revenue: 0,
                    };
                }
                productSales[item.productId].unitsSold += item.quantity;
                productSales[item.productId].revenue += item.subtotal;
            });
        });

        return Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [invoices]);

    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                </TableRow>
            ));
        }

        if (topProducts.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        No hay datos de productos vendidos.
                    </TableCell>
                </TableRow>
            );
        }

        return topProducts.map((product) => (
            <TableRow key={product.name}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.unitsSold}</TableCell>
                <TableCell className="text-right">${product.revenue.toLocaleString('es-CO')}</TableCell>
            </TableRow>
        ));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
                <CardDescription>Tus productos estrella por ingresos generados en el período.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Unidades</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {renderContent()}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
