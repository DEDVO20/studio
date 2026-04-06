'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import type { UserOptions } from 'jspdf-autotable';

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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCompanySettings } from '@/hooks/use-company-settings';
import { useToast } from '@/hooks/use-toast';
import type { Expense } from '@/lib/types';

type AggregatedExpense = {
  category: string;
  total: number;
  count: number;
};

export default function ExpensesReportPagePostgres() {
  const router = useRouter();
  const { toast } = useToast();
  const companySettings = useCompanySettings();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadExpenses() {
      setIsLoading(true);

      try {
        const response = await fetch('/api/expenses', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar el reporte de gastos.');
        }

        const body = (await response.json()) as { expenses?: Expense[] };

        if (isMounted) {
          setExpenses(body.expenses ?? []);
        }
      } catch (error) {
        console.error('Error loading expenses report:', error);
        if (isMounted) {
          setExpenses([]);
        }
        toast({
          variant: 'destructive',
          title: 'Error al cargar',
          description: 'No se pudo cargar la informacion de gastos.',
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadExpenses();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const aggregatedExpenses = useMemo<AggregatedExpense[]>(() => {
    const grouped = expenses.reduce(
      (acc, expense) => {
        if (!acc[expense.category]) {
          acc[expense.category] = { total: 0, count: 0 };
        }

        acc[expense.category].total += expense.amount;
        acc[expense.category].count += 1;
        return acc;
      },
      {} as Record<string, { total: number; count: number }>
    );

    return Object.entries(grouped)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const handleExportCsv = () => {
    if (aggregatedExpenses.length === 0) {
      toast({ variant: 'destructive', title: 'No hay datos para exportar' });
      return;
    }

    const csvHeaders = ['Categoria', 'Numero de Gastos', 'Monto Total'];
    const csvRows = aggregatedExpenses.map((expense) =>
      [`"${expense.category.replace(/"/g, '""')}"`, expense.count, expense.total].join(',')
    );

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte_gastos.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Exportacion CSV completa' });
  };

  const handleExportPdf = async () => {
    if (aggregatedExpenses.length === 0) {
      toast({ variant: 'destructive', title: 'No hay datos para exportar' });
      return;
    }

    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF() as any;
    const today = format(new Date(), 'P', { locale: es });

    doc.setFontSize(18);
    doc.text(`Reporte de Gastos por Categoria - ${companySettings.name}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generado el: ${today}`, 14, 30);

    doc.autoTable({
      startY: 40,
      head: [['Categoria', '# de Gastos', 'Monto Total']],
      body: aggregatedExpenses.map((expense) => [
        expense.category,
        expense.count,
        `$${expense.total.toLocaleString('es-CO')}`,
      ]),
    });

    doc.save('reporte_gastos.pdf');
    toast({ title: 'Exportacion PDF completa' });
  };

  const renderTableBody = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton className="h-6 w-28" /></TableCell>
          <TableCell className="text-center"><Skeleton className="mx-auto h-4 w-10" /></TableCell>
          <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
        </TableRow>
      ));
    }

    if (aggregatedExpenses.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
            No hay gastos registrados.
          </TableCell>
        </TableRow>
      );
    }

    return aggregatedExpenses.map((expense) => (
      <TableRow key={expense.category}>
        <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
        <TableCell className="text-center">{expense.count}</TableCell>
        <TableCell className="text-right font-semibold">${expense.total.toLocaleString('es-CO')}</TableCell>
      </TableRow>
    ));
  };

  return (
    <Card>
      <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
          <div>
            <CardTitle>Reporte de Gastos por Categoria</CardTitle>
            <CardDescription>Un resumen de tus gastos para identificar a donde se va tu dinero.</CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCsv}>Exportar a CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPdf}>Exportar a PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-center"># de Gastos</TableHead>
              <TableHead className="text-right">Monto Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderTableBody()}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
