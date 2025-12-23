'use client';

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
import { mockProducts } from '@/lib/data';
import { Badge } from '../ui/badge';

const lowStockProducts = mockProducts
    .filter(p => p.stock <= p.minStock)
    .sort((a,b) => (a.stock / a.minStock) - (b.stock / b.minStock));

export function LowStockTable() {
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
                    {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                        <TableCell className="font-medium">
                            <p>{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.sku}</p>
                        </TableCell>
                        <TableCell className="text-right">
                           <Badge variant="destructive">{product.stock}</Badge> / {product.minStock}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
