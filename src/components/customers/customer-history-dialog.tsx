'use client';

import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Customer, Invoice } from '@/lib/types';
import { mockInvoices } from '@/lib/data';
import { cn } from '@/lib/utils';


type CustomerHistoryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
};

const statusColors = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700',
    pending: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

export function CustomerHistoryDialog({
  isOpen,
  onClose,
  customer,
}: CustomerHistoryDialogProps) {

  // En una app real, esto vendría de la base de datos
  const customerInvoices = mockInvoices.filter(inv => inv.customerId === customer.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Historial de Cliente: {customer.name}</DialogTitle>
          <DialogDescription>
            Revisa el historial de facturación y el estado de cuenta del cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 text-sm my-4">
            <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Saldo Pendiente</div>
                <div className="font-semibold text-lg text-destructive">${customer.currentBalance.toLocaleString('es-CO')}</div>
            </div>
            <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Límite de Crédito</div>
                <div className="font-semibold text-lg">${customer.creditLimit.toLocaleString('es-CO')}</div>
            </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerInvoices.length > 0 ? customerInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(invoice.createdAt, 'dd/MM/yyyy')}
                  </TableCell>
                   <TableCell>
                  <Badge
                    variant="outline"
                    className={cn('capitalize', statusColors[invoice.status])}
                  >
                    {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : invoice.status === 'partial' ? 'Parcial' : 'Cancelada'}
                  </Badge>
                </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${invoice.total.toLocaleString('es-CO')}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        Este cliente no tiene facturas.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
