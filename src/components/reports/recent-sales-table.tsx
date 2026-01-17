
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
import type { Invoice } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '../ui/skeleton';

type RecentSalesTableProps = {
    invoices: Invoice[];
    isLoading: boolean;
};

export function RecentSalesTable({ invoices, isLoading }: RecentSalesTableProps) {
    
    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                </TableRow>
            ));
        }

        if (invoices.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No hay ventas recientes en este período.
                    </TableCell>
                </TableRow>
            );
        }

        return invoices.slice(0, 10).map((invoice) => (
            <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.customerName}</TableCell>
                <TableCell>{format(invoice.createdAt, 'P', { locale: es })}</TableCell>
                <TableCell className="text-right">${invoice.total.toLocaleString('es-CO')}</TableCell>
            </TableRow>
        ));
    };

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
                    {renderContent()}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
