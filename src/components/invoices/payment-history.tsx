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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Payment } from '@/lib/types';

type PaymentHistoryProps = {
    payments: Payment[];
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Pagos</CardTitle>
        <CardDescription>Un registro de todos los pagos realizados para esta factura.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Registrado por</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {payments.length > 0 ? (
                    payments.map(payment => (
                        <TableRow key={payment.id}>
                            <TableCell>{format(payment.createdAt, 'MMM d, yyyy, p')}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="capitalize">{payment.paymentMethod}</Badge>
                            </TableCell>
                            <TableCell>{payment.createdByName}</TableCell>
                            <TableCell className="text-right font-medium">${payment.amount.toLocaleString('es-CO')}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            No se han registrado pagos para esta factura.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
