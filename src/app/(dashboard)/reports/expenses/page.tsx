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
import { mockExpenses } from '@/lib/data';
import { Badge } from '@/components/ui/badge';

// Aggregate expenses by category
const expensesByCategory = mockExpenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
        acc[expense.category] = { total: 0, count: 0 };
    }
    acc[expense.category].total += expense.amount;
    acc[expense.category].count += 1;
    return acc;
}, {} as Record<string, { total: number; count: number }>);

const aggregatedExpenses = Object.entries(expensesByCategory).map(([category, data]) => ({
    category,
    ...data,
})).sort((a,b) => b.total - a.total);


export default function ExpensesReportPage() {
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
                {aggregatedExpenses.map((expense) => (
                    <TableRow key={expense.category}>
                        <TableCell>
                            <Badge variant="secondary">{expense.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{expense.count}</TableCell>
                        <TableCell className="text-right font-semibold">${expense.total.toLocaleString('es-CO')}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
