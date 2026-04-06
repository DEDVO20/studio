'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Plus, Building2, User, HelpCircle, FileText, CalendarDays } from 'lucide-react';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Invoice, Customer } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { defaultLogoBase64 } from '@/lib/logo';
import { useCompanySettings } from '@/hooks/use-company-settings';
import { getPdfCompatibleImage } from '@/lib/pdf-image';

const statusColors = {
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 ring-emerald-500/20',
  pending: 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 ring-rose-500/20',
  partial: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 ring-amber-500/20',
  cancelled: 'bg-slate-100 text-slate-800 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20 ring-slate-500/20',
};

type InvoiceDetailsProps = {
  invoice: Invoice;
  customer: Customer;
  onAddPayment: () => void;
};

export function InvoiceDetails({ invoice, customer, onAddPayment }: InvoiceDetailsProps) {
  const router = useRouter();
  const companySettings = useCompanySettings();

  const handleDownloadPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const pdf = new jsPDF() as any;
    
    // Paleta de colores profesionales
    const primaryColor = [15, 23, 42]; // slate-900
    const secondaryColor = [100, 116, 139]; // slate-500
    
    const logoForPdf = companySettings.logoUrl || defaultLogoBase64;
    const fallbackLogoForPdf = await getPdfCompatibleImage(defaultLogoBase64);
    let preparedLogoForPdf = fallbackLogoForPdf;

    try {
      preparedLogoForPdf = await getPdfCompatibleImage(logoForPdf);
    } catch (error) {
      console.error("Error preparing custom logo for PDF, falling back to default.", error);
    }

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 14;

    // Watermark con el logo de la empresa
    try {
      const pageHeight = pdf.internal.pageSize.getHeight();
      const watermarkSize = 100;
      const watermarkX = (pageWidth - watermarkSize) / 2;
      const watermarkY = (pageHeight - watermarkSize) / 2;
      
      pdf.setGState(new (pdf as any).GState({ opacity: 0.05 }));
      pdf.addImage(preparedLogoForPdf.dataUrl, preparedLogoForPdf.format, watermarkX, watermarkY, watermarkSize, watermarkSize, undefined, 'NONE');
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
    } catch (e) {
      console.error("Could not add watermark to PDF", e);
    }

    // Header: Logo y Datos de Empresa
    try {
      pdf.addImage(preparedLogoForPdf.dataUrl, preparedLogoForPdf.format, margin, margin, 24, 24);
    } catch(e) {
      console.error("Error adding custom logo to PDF, falling back to default.", e);
      pdf.addImage(fallbackLogoForPdf.dataUrl, fallbackLogoForPdf.format, margin, margin, 24, 24);
    }

    pdf.setFontSize(22);
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text(companySettings.name, 42, 22);

    pdf.setFontSize(10);
    pdf.setTextColor(...secondaryColor);
    pdf.setFont('helvetica', 'normal');
    pdf.text(companySettings.address || '', 42, 28);
    pdf.text(`NIT: ${companySettings.taxId || ''}`, 42, 33);
    pdf.text(companySettings.email || '', 42, 38);
    pdf.text(companySettings.phone || '', 42, 43);

    // Layout derecho: Título FACTURA y Detalles
    const rightAlign = pageWidth - margin;
    pdf.setFontSize(32);
    // Un gris muy suave para la marca de agua del título
    pdf.setTextColor(226, 232, 240); 
    pdf.setFont('helvetica', 'bold');
    pdf.text('FACTURA', rightAlign, 25, { align: 'right' });

    pdf.setFontSize(14);
    pdf.setTextColor(...primaryColor);
    pdf.text(`#${invoice.invoiceNumber}`, rightAlign, 33, { align: 'right' });

    pdf.setFontSize(10);
    pdf.setTextColor(...secondaryColor);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Fecha: ${format(invoice.createdAt, 'dd MMM yyyy', { locale: es })}`, rightAlign, 40, { align: 'right' });
    pdf.text(`Vence: ${format(invoice.dueDate, 'dd MMM yyyy', { locale: es })}`, rightAlign, 45, { align: 'right' });

    // Línea divisora
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, 52, rightAlign, 52);

    // Información del cliente (Izquierda)
    pdf.setFontSize(10);
    pdf.setTextColor(...secondaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FACTURADO A:', margin, 62);
    
    pdf.setTextColor(...primaryColor);
    pdf.text(customer.name, margin, 68);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...secondaryColor);
    pdf.text(customer.address || '', margin, 73);
    pdf.text(customer.email || '', margin, 78);
    if(customer.phone) pdf.text(customer.phone, margin, 83);

    // Recuadro de Estado (Derecha)
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(140, 58, 56, 26, 2, 2, 'FD');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...secondaryColor);
    pdf.text('ESTADO', 145, 65);
    
    let statusText = 'Pendiente';
    let statusColor = [225, 29, 72]; // rose-600
    if (invoice.status === 'paid') { statusText = 'Pagada'; statusColor = [16, 185, 129]; } // emerald-500
    if (invoice.status === 'partial') { statusText = 'Parcial'; statusColor = [245, 158, 11]; } // amber-500
    if (invoice.status === 'cancelled') { statusText = 'Cancelada'; statusColor = [100, 116, 139]; } // slate-500

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...statusColor);
    pdf.setFontSize(12);
    pdf.text(statusText.toUpperCase(), 145, 75);

    const tableStartY = 95;

    // Tabla de items modernizada
    pdf.autoTable({
      startY: tableStartY,
      head: [['Descripción', 'Cant', 'P.Unit', 'IVA', 'Total']],
      body: invoice.items.map(item => [
        item.productName,
        item.quantity,
        `$${item.unitPrice.toLocaleString('es-CO')}`,
        `${(item.taxRate * 100).toFixed(0)}%`,
        `$${(item.subtotal + item.taxAmount).toLocaleString('es-CO')}`
      ]),
      theme: 'grid',
      headStyles: { 
        fillColor: [248, 250, 252], 
        textColor: secondaryColor,
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [226, 232, 240],
        halign: 'center'
      },
      bodyStyles: {
        textColor: primaryColor,
        lineWidth: 0.1,
        lineColor: [226, 232, 240]
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 80, halign: 'left' },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin }
    });

    const finalY = (pdf as any).lastAutoTable.finalY + 10;
    
    // Sección de Notas (Izquierda)
    pdf.setFontSize(9);
    pdf.setTextColor(...secondaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Notas / Instrucciones:', margin, finalY);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.text('El pago total es requerido en o antes de la fecha de vencimiento acordada.', margin, finalY + 5);
    pdf.text(`Método de pago: ${invoice.paymentMethod || 'No especificado'}`, margin, finalY + 10);
    if (invoice.notes) {
      pdf.text(invoice.notes, margin, finalY + 15);
    }

    // Totales (Derecha)
    const totals = [
      ['Subtotal', `$${invoice.subtotal.toLocaleString('es-CO')}`],
      ['Impuesto', `$${invoice.tax.toLocaleString('es-CO')}`],
    ];
    if (invoice.discount > 0) {
      totals.push(['Descuento', `-$${invoice.discount.toLocaleString('es-CO')}`]);
    }
    totals.push(
      ['TOTAL', `$${invoice.total.toLocaleString('es-CO')}`],
      ['Pagado', `-$${invoice.paidAmount.toLocaleString('es-CO')}`],
      ['SALDO PENDIENTE', `$${invoice.balance.toLocaleString('es-CO')}`]
    );

    pdf.autoTable({
        startY: finalY,
        body: totals,
        theme: 'plain',
        tableWidth: 80,
        margin: { left: rightAlign - 80 },
        styles: {
            cellPadding: 2,
            fontSize: 10,
            textColor: primaryColor,
        },
        columnStyles: {
            0: { fontStyle: 'bold', halign: 'left' },
            1: { halign: 'right' }
        },
        didParseCell: (data: any) => {
            const isTotalRow = invoice.discount > 0 ? (data.row.index === 3) : (data.row.index === 2);
            const isBalanceRow = invoice.discount > 0 ? (data.row.index === 5) : (data.row.index === 4);

            if (isTotalRow) {
              data.cell.styles.fontSize = 12;
              data.cell.styles.fillColor = [248, 250, 252];
            }
            if (isBalanceRow) {
              data.cell.styles.fontSize = 11;
              data.cell.styles.textColor = invoice.balance > 0 ? [15, 23, 42] : [100, 116, 139];
              data.cell.styles.fillColor = invoice.balance > 0 ? [241, 245, 249] : [248, 250, 252];
            }
        }
    });

    // Footer
    const finalPageHeight = pdf.internal.pageSize.getHeight();
    pdf.setFontSize(8);
    pdf.setTextColor(...secondaryColor);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`© ${new Date().getFullYear()} ${companySettings.name}. Todos los derechos reservados.`, margin, finalPageHeight - 10);
    pdf.text('Factura generada electrónicamente', rightAlign, finalPageHeight - 10, { align: 'right' });

    pdf.save(`Factura-${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-500">
      {/* Botones Aciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Invoices
        </Button>
        <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPdf} className="bg-background">
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                <Button onClick={onAddPayment} className="shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Pago
                </Button>
            )}
        </div>
      </div>

      <Card className="overflow-hidden shadow-sm border-muted/60 relative bg-card">
        {/* Barra superior de color */}
        <div className="h-2 w-full bg-primary" />
        
        <CardContent className="p-6 sm:p-10 md:p-12">
          {/* Fila Encabezado */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-8 mb-10">
             <div className="space-y-4">
               {companySettings.logoUrl ? (
                 <img src={companySettings.logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
               ) : (
                 <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-primary">
                    <Building2 className="h-8 w-8 text-primary" />
                    {companySettings.name}
                 </div>
               )}
               <div className="text-sm text-muted-foreground w-full max-w-[220px] leading-relaxed">
                 <p className="font-semibold text-foreground">{companySettings.name}</p>
                 <p>{companySettings.address}</p>
                 <p>NIT: {companySettings.taxId}</p>
                 <p>{companySettings.email}</p>
                 <p>{companySettings.phone}</p>
               </div>
             </div>
             
             <div className="flex flex-col items-start sm:items-end space-y-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase text-muted-foreground/20">FACTURA</h1>
                <div className="text-2xl font-semibold text-primary mb-2">#{invoice.invoiceNumber}</div>
                
                <Badge variant="outline" className={cn('text-xs sm:text-sm px-3 py-1 uppercase tracking-wider font-semibold ring-1 ring-inset', statusColors[invoice.status])}>
                  {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : invoice.status === 'partial' ? 'Pago Parcial' : 'Cancelada'}
                </Badge>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-6 text-sm text-right align-middle">
                  <div className="text-muted-foreground flex items-center justify-end gap-1.5"><CalendarDays className="h-3.5 w-3.5"/> Fecha:</div>
                  <div className="font-medium text-foreground">{format(invoice.createdAt, 'dd MMM yyyy', { locale: es })}</div>
                  <div className="text-muted-foreground flex items-center justify-end gap-1.5"><CalendarDays className="h-3.5 w-3.5"/> Vence:</div>
                  <div className="font-medium text-foreground">{format(invoice.dueDate, 'dd MMM yyyy', { locale: es })}</div>
                </div>
             </div>
          </div>
          
          <Separator className="my-10 border-muted-foreground/10" />

          {/* Información de envío/facturación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="bg-muted/40 rounded-xl p-6 border border-border/50">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" /> Facturado a
                  </h3>
                  <div className="space-y-1">
                      <p className="text-lg font-bold text-foreground">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.address}</p>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
              </div>
              
              <div className="bg-muted/40 rounded-xl p-6 border border-border/50 flex flex-col justify-start items-start md:items-end text-left md:text-right">
                    <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4 flex items-center gap-2 md:flex-row-reverse">
                        <FileText className="h-4 w-4" /> Detalle Adicional
                    </h3>
                    <p className="text-sm text-muted-foreground">Método de pago: <strong className="text-foreground capitalize font-medium">{invoice.paymentMethod || 'No especificado'}</strong></p>
                    {invoice.notes && (
                      <p className="text-sm text-muted-foreground italic mt-3 max-w-xs">{invoice.notes}</p>
                    )}
              </div>
          </div>

          {/* Tabla de Artículos */}
          <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden mb-10">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border/60">
                      <tr>
                          <th className="py-3 px-4 text-left font-semibold text-muted-foreground uppercase text-xs tracking-wider">Descripción</th>
                          <th className="py-3 px-4 text-center font-semibold text-muted-foreground uppercase text-xs tracking-wider w-24">Cant</th>
                          <th className="py-3 px-4 text-right font-semibold text-muted-foreground uppercase text-xs tracking-wider w-32">Precio Und</th>
                          <th className="py-3 px-4 text-right font-semibold text-muted-foreground uppercase text-xs tracking-wider w-24">IVA</th>
                          <th className="py-3 px-4 text-right font-semibold text-muted-foreground uppercase text-xs tracking-wider w-36">Monto Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                    {invoice.items.map((item, index) => (
                        <tr key={index} className="transition-colors hover:bg-muted/20">
                            <td className="py-4 px-4 text-left">
                                <span className="font-medium">{item.productName}</span>
                            </td>
                            <td className="py-4 px-4 text-center text-muted-foreground">{item.quantity}</td>
                            <td className="py-4 px-4 text-right text-muted-foreground">${item.unitPrice.toLocaleString('es-CO')}</td>
                            <td className="py-4 px-4 text-right text-muted-foreground">{(item.taxRate * 100).toFixed(0)}%</td>
                            <td className="py-4 px-4 text-right font-medium">${(item.subtotal + item.taxAmount).toLocaleString('es-CO')}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              </div>
          </div>

          {/* Sección de Totales */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
             <div className="w-full md:w-5/12 text-sm text-muted-foreground bg-amber-50 dark:bg-amber-500/10 p-5 rounded-xl flex items-start gap-4 border border-amber-200 dark:border-amber-500/20">
                <HelpCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="leading-relaxed">
                    El pago total es requerido en o antes de la fecha de vencimiento acordada. 
                    Por favor, conserve esta factura para sus registros.
                </p>
             </div>
             
             <div className="w-full md:w-72 space-y-3">
                <div className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${invoice.subtotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground">Impuestos</span>
                    <span className="font-medium">${invoice.tax.toLocaleString('es-CO')}</span>
                </div>
                {invoice.discount > 0 && (
                <div className="flex justify-between text-sm py-1 text-emerald-600 dark:text-emerald-400">
                    <span>Descuento</span>
                    <span className="font-medium">-${invoice.discount.toLocaleString('es-CO')}</span>
                </div>
                )}
                
                <Separator className="my-3 border-border/60" />
                
                <div className="flex justify-between items-center py-2">
                    <span className="text-lg font-bold text-foreground">Total</span>
                    <span className="text-2xl font-black tracking-tight">${invoice.total.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-sm py-1 text-muted-foreground">
                    <span>Monto Pagado</span>
                    <span>-${invoice.paidAmount.toLocaleString('es-CO')}</span>
                </div>
                
                <div className={cn(
                    "flex justify-between items-center py-4 px-5 rounded-xl mt-4 font-bold text-lg border",
                    invoice.balance > 0 
                      ? "bg-primary/5 text-primary border-primary/20" 
                      : "bg-muted/50 text-muted-foreground border-transparent"
                )}>
                    <span>Saldo Pendiente</span>
                    <span>${invoice.balance.toLocaleString('es-CO')}</span>
                </div>
             </div>
          </div>
          
        </CardContent>
            
        {/* Footer Informativo */}
        <div className="bg-muted/30 px-8 py-5 text-center sm:text-left text-xs text-muted-foreground border-t flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© {new Date().getFullYear()} {companySettings.name}. Todos los derechos reservados.</span>
            <span>Factura generada electrónicamente</span>
        </div>
      </Card>
    </div>
  );
}
