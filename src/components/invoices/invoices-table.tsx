'use client';

import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockInvoices } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusColors = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700',
  pending: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700',
  partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

export function InvoicesTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Facturas</CardTitle>
        <CardDescription>
          Gestiona tus facturas y sigue su estado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>{invoice.customerName}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn('capitalize', statusColors[invoice.status])}
                  >
                    {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : invoice.status === 'partial' ? 'Parcial' : 'Cancelada'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(invoice.createdAt, 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  ${invoice.total.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${invoice.balance.toFixed(2)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/invoices/${invoice.id}`}>Ver Detalles</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Descargar PDF</DropdownMenuItem>
                      <DropdownMenuItem>Cancelar Factura</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
