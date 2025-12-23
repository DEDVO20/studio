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
import { mockCustomers } from '@/lib/data';
import { Progress } from '@/components/ui/progress';

const customersWithBalance = mockCustomers.filter(c => c.currentBalance > 0);

export default function CustomersReportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reporte de Clientes</CardTitle>
        <CardDescription>
          Supervisa los saldos pendientes y la actividad de tus clientes más importantes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Límite de Crédito</TableHead>
              <TableHead>Uso de Crédito</TableHead>
              <TableHead className="text-right">Saldo Pendiente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customersWithBalance.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-muted-foreground">{customer.email}</div>
                </TableCell>
                <TableCell>
                  ${customer.creditLimit.toLocaleString('es-CO')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={(customer.currentBalance / customer.creditLimit) * 100} className="w-24" />
                    <span>{Math.round((customer.currentBalance / customer.creditLimit) * 100)}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${customer.currentBalance.toLocaleString('es-CO')}
                </TableCell>
              </TableRow>
            ))}
             {customersWithBalance.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No hay clientes con saldos pendientes.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
