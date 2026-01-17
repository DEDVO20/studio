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
import { Progress } from '@/components/ui/progress';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Customer } from '@/lib/types';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomersReportPage() {
    const firestore = useFirestore();

    const customersRef = useMemoFirebase(() => collection(firestore, 'customers'), [firestore]);
    const { data: customersData, isLoading } = useCollection<Customer>(customersRef);

    const customersWithBalance = useMemo(() => {
        if (!customersData) return [];
        return customersData.filter(c => c.currentBalance > 0 && c.creditLimit > 0);
    }, [customersData]);

    const renderTableBody = () => {
        if (isLoading) {
            return Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                </TableRow>
            ));
        }

        if (customersWithBalance.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No hay clientes con saldos pendientes.
                    </TableCell>
                </TableRow>
            );
        }

        return customersWithBalance.map((customer) => (
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
          ));
    }


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
            {renderTableBody()}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
