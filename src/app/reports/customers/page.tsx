export { default } from './customers-report-page-postgres';
/*
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useCompanySettings } from '@/hooks/use-company-settings';
import type { UserOptions } from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function LegacyCustomersReportPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const companySettings = useCompanySettings();

    const customersRef = useMemoFirebase(() => collection(firestore, 'customers'), [firestore]);
    const { data: customersData, isLoading } = useCollection<Customer>(customersRef);

    const customersWithBalance = useMemo(() => {
        if (!customersData) return [];
        return customersData.filter(c => c.currentBalance > 0 && c.creditLimit > 0);
    }, [customersData]);
    
    const handleExportCsv = () => {
        if (customersWithBalance.length === 0) {
            toast({ variant: 'destructive', title: 'No hay datos para exportar' });
            return;
        }

        const csvHeaders = ["ID Cliente", "Nombre", "Email", "Teléfono", "Límite de Crédito", "Saldo Actual"];
        const csvRows = customersWithBalance.map(c => [
            c.id,
            `"${c.name.replace(/"/g, '""')}"`,
            c.email,
            c.phone,
            c.creditLimit,
            c.currentBalance,
        ].join(','));

        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'reporte_clientes_saldo.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Exportación CSV Completa" });
    };

    const handleExportPdf = async () => {
        if (customersWithBalance.length === 0) {
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
        doc.text(`Reporte de Saldos de Clientes - ${companySettings.name}`, 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado el: ${today}`, 14, 30);

        doc.autoTable({
            startY: 40,
            head: [['Cliente', 'Límite de Crédito', 'Saldo Pendiente', 'Uso de Crédito (%)']],
            body: customersWithBalance.map(c => [
                c.name,
                `$${c.creditLimit.toLocaleString('es-CO')}`,
                `$${c.currentBalance.toLocaleString('es-CO')}`,
                `${Math.round((c.currentBalance / c.creditLimit) * 100)}%`,
            ]),
        });
        
        doc.save('reporte_clientes_saldo.pdf');
        toast({ title: "Exportación PDF Completa" });
    };

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
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver</span>
            </Button>
            <div>
                <CardTitle>Reporte de Clientes</CardTitle>
                <CardDescription>
                Supervisa los saldos pendientes y la actividad de tus clientes más importantes.
                </CardDescription>
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

*/
