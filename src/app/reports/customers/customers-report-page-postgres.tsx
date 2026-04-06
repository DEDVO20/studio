'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import type { UserOptions } from 'jspdf-autotable';

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
import { Progress } from '@/components/ui/progress';
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
import type { Customer } from '@/lib/types';

export default function CustomersReportPagePostgres() {
  const router = useRouter();
  const { toast } = useToast();
  const companySettings = useCompanySettings();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCustomers() {
      setIsLoading(true);

      try {
        const response = await fetch('/api/customers', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar el reporte de clientes.');
        }

        const body = (await response.json()) as { customers?: Customer[] };

        if (isMounted) {
          setCustomers(body.customers ?? []);
        }
      } catch (error) {
        console.error('Error loading customers report:', error);
        if (isMounted) {
          setCustomers([]);
        }
        toast({
          variant: 'destructive',
          title: 'Error al cargar',
          description: 'No se pudo cargar la informacion de clientes.',
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCustomers();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const customersWithBalance = useMemo(
    () => customers.filter((customer) => customer.currentBalance > 0 && customer.creditLimit > 0),
    [customers]
  );

  const handleExportCsv = () => {
    if (customersWithBalance.length === 0) {
      toast({ variant: 'destructive', title: 'No hay datos para exportar' });
      return;
    }

    const csvHeaders = ['ID Cliente', 'Nombre', 'Email', 'Telefono', 'Limite de Credito', 'Saldo Actual'];
    const csvRows = customersWithBalance.map((customer) =>
      [
        customer.id,
        `"${customer.name.replace(/"/g, '""')}"`,
        customer.email,
        customer.phone,
        customer.creditLimit,
        customer.currentBalance,
      ].join(',')
    );

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte_clientes_saldo.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Exportacion CSV completa' });
  };

  const handleExportPdf = async () => {
    if (customersWithBalance.length === 0) {
      toast({ variant: 'destructive', title: 'No hay datos para exportar' });
      return;
    }

    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF() as any;
    const today = format(new Date(), 'P', { locale: es });

    doc.setFontSize(18);
    doc.text(`Reporte de Saldos de Clientes - ${companySettings.name}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generado el: ${today}`, 14, 30);

    doc.autoTable({
      startY: 40,
      head: [['Cliente', 'Limite de Credito', 'Saldo Pendiente', 'Uso de Credito (%)']],
      body: customersWithBalance.map((customer) => [
        customer.name,
        `$${customer.creditLimit.toLocaleString('es-CO')}`,
        `$${customer.currentBalance.toLocaleString('es-CO')}`,
        `${Math.round((customer.currentBalance / customer.creditLimit) * 100)}%`,
      ]),
    });

    doc.save('reporte_clientes_saldo.pdf');
    toast({ title: 'Exportacion PDF completa' });
  };

  const renderTableBody = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-36" /></TableCell>
          <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
        </TableRow>
      ));
    }

    if (customersWithBalance.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
            No hay clientes con saldos pendientes.
          </TableCell>
        </TableRow>
      );
    }

    return customersWithBalance.map((customer) => {
      const creditUsage = Math.round((customer.currentBalance / customer.creditLimit) * 100);

      return (
        <TableRow key={customer.id}>
          <TableCell>
            <div className="font-medium">{customer.name}</div>
            <div className="text-sm text-muted-foreground">{customer.email}</div>
          </TableCell>
          <TableCell>${customer.creditLimit.toLocaleString('es-CO')}</TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Progress value={creditUsage} className="w-24" />
              <span>{creditUsage}%</span>
            </div>
          </TableCell>
          <TableCell className="text-right font-semibold">${customer.currentBalance.toLocaleString('es-CO')}</TableCell>
        </TableRow>
      );
    });
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
            <CardTitle>Reporte de Clientes</CardTitle>
            <CardDescription>Supervisa los saldos pendientes y el uso de credito de tus clientes.</CardDescription>
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
              <TableHead>Limite de Credito</TableHead>
              <TableHead>Uso de Credito</TableHead>
              <TableHead className="text-right">Saldo Pendiente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderTableBody()}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
