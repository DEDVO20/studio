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
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useCompanySettings } from '@/hooks/use-company-settings';
import type { UserOptions } from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ExpensesReportPage() {
    const firestore = useFirestore();
    const expensesRef = useMemoFirebase(() => collection(firestore, 'expenses'), [firestore]);
    const { data: expensesData, isLoading } = useCollection<Expense>(expensesRef);
    const { toast } = useToast();
    const companySettings = useCompanySettings();

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

    const handleExportCsv = () => {
        if (aggregatedExpenses.length === 0) {
            toast({ variant: 'destructive', title: 'No hay datos para exportar' });
            return;
        }

        const csvHeaders = ["Categoría", "Número de Gastos", "Monto Total"];
        const csvRows = aggregatedExpenses.map(e => [
            `"${e.category.replace(/"/g, '""')}"`,
            e.count,
            e.total,
        ].join(','));

        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'reporte_gastos.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Exportación CSV Completa" });
    };

    const handleExportPdf = async () => {
        if (aggregatedExpenses.length === 0) {
            toast({ variant: 'destructive', title: 'No hay datos para exportar' });
            return;
        }

        const { default: jsPDF } = await import('jspdf');
        await import('jspdf-autotable');

        interface jsPDFWithAutoTable extends jsPDF {
            autoTable: (options: UserOptions) => jsPDF;
        }
        const doc = new jsPDF() as jsPDFWithAutoTable;
        
        const today = format(new Date(), "P", { locale: es });

        // Header
        doc.setFontSize(18);
        doc.text(`Reporte de Gastos por Categoría - ${companySettings.name}`, 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado el: ${today}`, 14, 30);

        doc.autoTable({
            startY: 40,
            head: [['Categoría', '# de Gastos', 'Monto Total']],
            body: aggregatedExpenses.map(e => [
                e.category,
                e.count,
                `$${e.total.toLocaleString('es-CO')}`,
            ]),
        });
        
        doc.save('reporte_gastos.pdf');
        toast({ title: "Exportación PDF Completa" });
    };

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
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <CardTitle>Reporte de Gastos por Categoría</CardTitle>
            <CardDescription>
            Un resumen de tus gastos para identificar a dónde se va tu dinero.
            </CardDescription>
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
