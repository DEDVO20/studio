'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { UserOptions } from 'jspdf-autotable';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Invoice, Customer } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { defaultLogoBase64 } from '@/lib/logo';
import { useCompanySettings } from '@/hooks/use-company-settings';

const statusColors = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700',
    pending: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  };

type InvoiceDetailsProps = {
  invoice: Invoice;
  customer: Customer;
  onAddPayment: () => void;
};

export function InvoiceDetails({ invoice, customer, onAddPayment }: InvoiceDetailsProps) {
  const companySettings = useCompanySettings();

  const handleDownloadPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    
    // Extend jsPDF with autoTable
    interface jsPDFWithAutoTable extends jsPDF {
      autoTable: (options: UserOptions) => jsPDF;
    }
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    const logoForPdf = companySettings.logoUrl || defaultLogoBase64;
    const companyInfo = {
        name: companySettings.name,
        address: companySettings.address,
        email: companySettings.email,
    };
    
    // Watermark
    try {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const watermarkWidth = 100;
      const watermarkHeight = 100;
      const watermarkX = (pageWidth - watermarkWidth) / 2;
      const watermarkY = (pageHeight - watermarkHeight) / 2;
      
      doc.setGState(new (doc as any).GState({opacity: 0.1}));
      doc.addImage(logoForPdf, '', watermarkX, watermarkY, watermarkWidth, watermarkHeight, undefined, 'NONE', 45);
      doc.setGState(new (doc as any).GState({opacity: 1}));
    } catch (e) {
      console.error("Could not add watermark to PDF", e);
    }
    
    // Logo y Título
    try {
      doc.addImage(logoForPdf, '', 14, 18, 20, 20);
    } catch(e) {
      console.error("Error adding custom logo to PDF, falling back to default.", e);
      doc.addImage(defaultLogoBase64, '', 14, 18, 20, 20);
    }
    doc.setFontSize(20);
    doc.text(`Factura ${invoice.invoiceNumber}`, 40, 28);


    // Información de la empresa
    doc.setFontSize(10);
    doc.text('De:', 14, 50);
    doc.text(companyInfo.name, 14, 55);
    doc.text(companyInfo.address, 14, 60);
    doc.text(companyInfo.email, 14, 65);

    // Información del cliente
    doc.text('Facturado a:', 140, 50);
    doc.text(customer.name, 140, 55);
    doc.text(customer.address, 140, 60);
    doc.text(customer.email, 140, 65);
    
    // Detalles de la factura
    doc.setFontSize(12);
    doc.text('Fecha:', 14, 80);
    doc.text(format(invoice.createdAt, 'PPP', { locale: es }), 40, 80);
    doc.text('Vence:', 14, 88);
    doc.text(format(invoice.dueDate, 'PPP', { locale: es }), 40, 88);
    
    const tableStartY = 95;

    // Tabla de items
    doc.autoTable({
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
      headStyles: { fillColor: [34, 197, 94] }, // Tailwind green-500
    });

    // Totales
    const finalY = (doc as any).lastAutoTable.finalY;
    const totals = [
      ['Subtotal', `$${invoice.subtotal.toLocaleString('es-CO')}`],
      ['Impuesto Total', `$${invoice.tax.toLocaleString('es-CO')}`],
      ['Descuento', `-$${invoice.discount.toLocaleString('es-CO')}`],
      ['Total', `$${invoice.total.toLocaleString('es-CO')}`],
      ['Pagado', `-$${invoice.paidAmount.toLocaleString('es-CO')}`],
      ['Saldo Pendiente', `$${invoice.balance.toLocaleString('es-CO')}`],
    ];

    doc.autoTable({
        startY: finalY + 5,
        body: totals,
        theme: 'plain',
        tableWidth: 'wrap',
        margin: { left: 130 },
        styles: {
            cellPadding: 1,
            fontSize: 10,
        },
        columnStyles: {
            0: { fontStyle: 'bold' },
            1: { halign: 'right' }
        },
        didParseCell: (data) => {
            if (data.row.index >= 3) {
              data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    doc.save(`Factura-${invoice.invoiceNumber}.pdf`);
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-2xl">{invoice.invoiceNumber}</CardTitle>
          <CardDescription>
            Fecha: {format(invoice.createdAt, 'PPP', { locale: es })}
          </CardDescription>
        </div>
        <div className="text-right">
            <Badge className={cn('text-base capitalize', statusColors[invoice.status])}>
              {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : invoice.status === 'partial' ? 'Parcial' : 'Cancelada'}
            </Badge>
            <p className="text-sm text-muted-foreground">Vence: {format(invoice.dueDate, 'PPP', { locale: es })}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 md:grid-cols-2">
            <div>
                <h3 className="font-semibold mb-2">Facturado a:</h3>
                <address className="not-italic text-muted-foreground">
                    <strong className="text-foreground">{customer.name}</strong><br />
                    {customer.address}<br />
                    {customer.email}<br />
                    {customer.phone}
                </address>
            </div>
             <div className="text-left md:text-right">
                <h3 className="font-semibold mb-2">De:</h3>
                <address className="not-italic text-muted-foreground">
                    <strong className="text-foreground">{companySettings.name}</strong><br />
                    {companySettings.address}<br />
                    {companySettings.email}<br />
                    {companySettings.phone}
                </address>
            </div>
        </div>

        <Separator className="my-6" />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left font-semibold">Producto</th>
                <th className="py-2 text-center font-semibold">Cantidad</th>
                <th className="py-2 text-right font-semibold">Precio Unitario</th>
                <th className="py-2 text-right font-semibold">IVA</th>
                <th className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">${item.unitPrice.toLocaleString('es-CO')}</td>
                  <td className="py-2 text-right">{(item.taxRate * 100).toFixed(0)}%</td>
                  <td className="py-2 text-right">${(item.subtotal + item.taxAmount).toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${invoice.subtotal.toLocaleString('es-CO')}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Impuesto Total</span>
                <span>${invoice.tax.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Descuento</span>
                <span>-${invoice.discount.toLocaleString('es-CO')}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
                <span >Total</span>
                <span>${invoice.total.toLocaleString('es-CO')}</span>
            </div>
             <div className="flex justify-between text-green-600">
                <span >Pagado</span>
                <span>-${invoice.paidAmount.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-primary">
                <span >Saldo Pendiente</span>
                <span>${invoice.balance.toLocaleString('es-CO')}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onClick={handleDownloadPdf}>Descargar PDF</Button>
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <Button onClick={onAddPayment}>Registrar un Pago</Button>
        )}
      </CardFooter>
    </Card>
  );
}
