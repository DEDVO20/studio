
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
import { mockInvoices } from '@/lib/data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function RecentSalesTable() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Ventas Recientes</CardTitle>
                <CardDescription>Un listado de las ventas más recientes en el período seleccionado.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Factura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockInvoices.slice(0, 10).map((invoice) => (
                    <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{format(invoice.createdAt, 'P', { locale: es })}</TableCell>
                        <TableCell className="text-right">${invoice.total.toLocaleString('es-CO')}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
