'use client';

import { useState } from 'react';
import { MoreHorizontal, File } from 'lucide-react';
import Link from 'next/link';
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
  CardFooter
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type Invoice, type Customer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { defaultLogoBase64 } from '@/lib/logo';
import { useCompanySettings } from '@/hooks/use-company-settings';
import { Skeleton } from '../ui/skeleton';
import { getPdfCompatibleImage } from '@/lib/pdf-image';

const statusColors = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700',
  pending: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700',
  partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

type InvoicesTableProps = {
    invoices: Invoice[];
    title: string;
    description: string;
    onExport: () => void;
    onUpdateInvoice: (updatedInvoice: Invoice) => Promise<void>;
    isLoading: boolean;
    loadCustomerById?: (customerId: string) => Promise<Customer | undefined>;
    firestore?: unknown;
}

export function InvoicesTable({ invoices, title, description, onExport, onUpdateInvoice, isLoading, loadCustomerById }: InvoicesTableProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const companySettings = useCompanySettings();

    const handleRowDoubleClick = (invoiceId: string) => {
        router.push(`/invoices/${invoiceId}`);
    };

    const handleDownloadPdf = async (invoice: Invoice) => {
        const { default: jsPDF } = await import('jspdf');
        await import('jspdf-autotable');

        let customer: Customer | undefined;
        if (invoice.customerId === 'general') {
            customer = {
                id: 'general', name: 'Cliente General', email: '', phone: '',
                address: '', taxId: '', creditLimit: 0, currentBalance: 0,
                createdAt: new Date(), updatedAt: new Date(),
            };
        } else {
            try {
                customer = loadCustomerById ? await loadCustomerById(invoice.customerId) : undefined;
            } catch (error) {
                console.error("Error fetching customer for PDF:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron obtener los datos del cliente.' });
                return;
            }
        }

        if (!customer) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se encontraron los datos del cliente para esta factura.' });
          return;
        }

        const pdf = new jsPDF() as any;
        
        const logoForPdf = companySettings.logoUrl || defaultLogoBase64;
        const fallbackLogoForPdf = await getPdfCompatibleImage(defaultLogoBase64);
        let preparedLogoForPdf = fallbackLogoForPdf;

        try {
            preparedLogoForPdf = await getPdfCompatibleImage(logoForPdf);
        } catch (error) {
            console.error("Error preparing custom logo for PDF, falling back to default.", error);
        }

        const companyInfo = {
            name: companySettings.name,
            address: companySettings.address,
            email: companySettings.email,
        };
        
        // Watermark
        try {
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const watermarkWidth = 100;
            const watermarkHeight = 100;
            const watermarkX = (pageWidth - watermarkWidth) / 2;
            const watermarkY = (pageHeight - watermarkHeight) / 2;
            
            pdf.setGState(new (pdf as any).GState({opacity: 0.1}));
            pdf.addImage(preparedLogoForPdf.dataUrl, preparedLogoForPdf.format, watermarkX, watermarkY, watermarkWidth, watermarkHeight, undefined, 'NONE', 45);
            pdf.setGState(new (pdf as any).GState({opacity: 1}));
        } catch (e) {
            console.error("Could not add watermark to PDF", e);
        }

        // Logo y Título
        try {
            pdf.addImage(preparedLogoForPdf.dataUrl, preparedLogoForPdf.format, 14, 18, 20, 20);
        } catch(e) {
            console.error("Error adding custom logo to PDF, falling back to default.", e);
            pdf.addImage(fallbackLogoForPdf.dataUrl, fallbackLogoForPdf.format, 14, 18, 20, 20);
        }
        pdf.setFontSize(20);
        pdf.text(`Factura ${invoice.invoiceNumber}`, 40, 28);

        // Información de la empresa
        pdf.setFontSize(10);
        pdf.text('De:', 14, 50);
        pdf.text(companyInfo.name, 14, 55);
        pdf.text(companyInfo.address, 14, 60);
        pdf.text(companyInfo.email, 14, 65);

        // Información del cliente
        pdf.text('Facturado a:', 140, 50);
        pdf.text(customer.name, 140, 55);
        pdf.text(customer.address, 140, 60);
        pdf.text(customer.email, 140, 65);
        
        // Detalles de la factura
        pdf.setFontSize(12);
        pdf.text('Fecha:', 14, 80);
        pdf.text(format(invoice.createdAt, 'PPP', { locale: es }), 40, 80);
        pdf.text('Vence:', 14, 88);
        pdf.text(format(invoice.dueDate, 'PPP', { locale: es }), 40, 88);
        
        const tableStartY = 95;

        pdf.autoTable({
          startY: tableStartY,
          head: [['Producto', 'Cant.', 'P. Unitario', 'IVA', 'Total']],
          body: invoice.items.map(item => [
            item.productName,
            item.quantity,
            `$${item.unitPrice.toLocaleString('es-CO')}`,
            `${(item.taxRate * 100).toFixed(0)}%`,
            `$${(item.subtotal + item.taxAmount).toLocaleString('es-CO')}`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94] },
        });

        const finalY = (pdf as any).lastAutoTable.finalY;
        const totals = [
          ['Subtotal', `$${invoice.subtotal.toLocaleString('es-CO')}`],
          ['Impuesto Total', `$${invoice.tax.toLocaleString('es-CO')}`],
          ['Descuento', `-$${invoice.discount.toLocaleString('es-CO')}`],
          ['Total', `$${invoice.total.toLocaleString('es-CO')}`],
          ['Pagado', `-$${invoice.paidAmount.toLocaleString('es-CO')}`],
          ['Saldo Pendiente', `$${invoice.balance.toLocaleString('es-CO')}`],
        ];

        pdf.autoTable({
            startY: finalY + 5, body: totals, theme: 'plain', tableWidth: 'wrap',
            margin: { left: 130 }, styles: { cellPadding: 1, fontSize: 10, },
            columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
            didParseCell: (data: any) => { if (data.row.index >= 3) { data.cell.styles.fontStyle = 'bold'; } }
        });
        pdf.save(`Factura-${invoice.invoiceNumber}.pdf`);
    };

    const confirmCancelInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsAlertOpen(true);
    };
    
    const handleCancelInvoice = async () => {
        if (!selectedInvoice) return;

        try {
            const updatedInvoice = { ...selectedInvoice, status: 'cancelled' as const };
            await onUpdateInvoice(updatedInvoice);

            toast({
                title: 'Factura Cancelada',
                description: `La factura ${selectedInvoice.invoiceNumber} fue cancelada correctamente.`,
            });
        } catch (error) {
            console.error('Error cancelling invoice:', error);
            toast({
                variant: 'destructive',
                title: 'Error al cancelar',
                description:
                    error instanceof Error
                        ? error.message
                        : 'No se pudo cancelar la factura.',
            });
        } finally {
            setIsAlertOpen(false);
            setSelectedInvoice(null);
        }
    };

    const renderTableBody = () => {
        if (isLoading) {
          return Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-6 w-20" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="hidden md:table-cell text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
              <TableCell className="hidden sm:table-cell text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
            </TableRow>
          ));
        }
    
        if (invoices.length === 0) {
          return (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No hay facturas en esta categoría.
              </TableCell>
            </TableRow>
          );
        }
    
        return invoices.map((invoice) => (
          <TableRow key={invoice.id} onDoubleClick={() => handleRowDoubleClick(invoice.id)} className="cursor-pointer">
            <TableCell className="font-medium">
              {invoice.invoiceNumber}
            </TableCell>
            <TableCell className="hidden sm:table-cell">{invoice.customerName}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn('capitalize', statusColors[invoice.status])}
              >
                {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : invoice.status === 'partial' ? 'Parcial' : 'Cancelada'}
              </Badge>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              {format(invoice.createdAt, 'MMM d, yyyy', { locale: es })}
            </TableCell>
            <TableCell className="hidden md:table-cell text-right">
              ${invoice.total.toLocaleString('es-CO')}
            </TableCell>
            <TableCell className="hidden sm:table-cell text-right font-semibold">
              ${invoice.balance.toLocaleString('es-CO')}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/invoices/${invoice.id}`}>Ver Detalles</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadPdf(invoice)}>Descargar PDF</DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => confirmCancelInvoice(invoice)}
                    disabled={
                      invoice.status === 'cancelled' ||
                      invoice.status === 'paid' ||
                      invoice.status === 'partial' ||
                      invoice.paidAmount > 0
                    }
                    className="text-destructive"
                  >
                    Cancelar Factura
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ));
      };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={onExport}>
          <File className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Exportar
          </span>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead className="hidden sm:table-cell">Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden lg:table-cell">Fecha</TableHead>
              <TableHead className="hidden md:table-cell text-right">Total</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Saldo</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableBody()}
          </TableBody>
        </Table>
      </CardContent>
       {invoices.length > 0 && (
         <CardFooter>
            <div className="text-xs text-muted-foreground">
                Mostrando <strong>{invoices.length}</strong> {invoices.length === 1 ? 'factura' : 'facturas'}.
            </div>
         </CardFooter>
      )}
    </Card>

    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de cancelar esta factura?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. La factura {selectedInvoice?.invoiceNumber} será marcada como cancelada.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInvoice}>Sí, cancelar factura</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
