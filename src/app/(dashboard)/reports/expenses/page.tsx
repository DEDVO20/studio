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
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Expense } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExpensesReportPage() {
    const firestore = useFirestore();
    const expensesRef = useMemoFirebase(() => collection(firestore, 'expenses'), [firestore]);
    const { data: expensesData, isLoading } = useCollection<Expense>(expensesRef);

    const aggregatedExpenses = useMemo(() => {
        if (!expensesData) return [];

        const expensesByCategory = expensesData.reduce((acc, expense) => {
            if (!acc[expense.category]) {
                acc[expense.category] = { total: 0, count: 0 };
            }
            acc[expense.category].total += expense.amount;
            acc[expense.category].count += 1;
            return acc;
        }, {} as Record<string, { total: number; count: number }>);
        
        return Object.entries(expensesByCategory).map(([category, data]) => ({
            category,
            ...data,
        })).sort((a,b) => b.total - a.total);
    }, [expensesData]);

    const renderTableBody = () => {
        if (isLoading) {
            return Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                </TableRow>
            ));
        }

        if (aggregatedExpenses.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No hay gastos registrados.
                    </TableCell>
                </TableRow>
            );
        }

        return aggregatedExpenses.map((expense) => (
            <TableRow key={expense.category}>
                <TableCell>
                    <Badge variant="secondary">{expense.category}</Badge>
                </TableCell>
                <TableCell className="text-center">{expense.count}</TableCell>
                <TableCell className="text-right font-semibold">${expense.total.toLocaleString('es-CO')}</TableCell>
            </TableRow>
        ));
    };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Reporte de Gastos por Categoría</CardTitle>
        <CardDescription>
          Un resumen de tus gastos para identificar a dónde se va tu dinero.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-center"># de Gastos</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
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
