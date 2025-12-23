
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

const topProducts = mockProducts.slice(0,5).map(p => ({...p, unitsSold: Math.floor(Math.random() * 50) + 10, revenue: (Math.floor(Math.random() * 50) + 10) * p.price })).sort((a, b) => b.revenue - a.revenue);

export function TopProductsTable() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
                <CardDescription>Tus productos estrella por ingresos generados.</CardDescription>
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
                    {topProducts.map((product) => (
                    <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.unitsSold}</TableCell>
                        <TableCell className="text-right">${product.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
