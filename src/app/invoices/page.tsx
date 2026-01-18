'use client';

import { useMemo } from 'react';
import { File, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { InvoicesTable } from '@/components/invoices/invoices-table';
import type { Invoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

export default function InvoicesPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const invoicesRef = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const { data: invoicesData, isLoading } = useCollection<Invoice>(invoicesRef);

  const invoices: Invoice[] = useMemo(() => {
    if (!invoicesData) return [];
    return invoicesData.map(inv => ({
        ...inv,
        createdAt: (inv.createdAt as any)?.toDate ? (inv.createdAt as any).toDate() : new Date(),
        updatedAt: (inv.updatedAt as any)?.toDate ? (inv.updatedAt as any).toDate() : new Date(),
        dueDate: (inv.dueDate as any)?.toDate ? (inv.dueDate as any).toDate() : new Date(),
    }));
  }, [invoicesData]);

  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  const partialInvoices = invoices.filter(i => i.status === 'partial');
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const cancelledInvoices = invoices.filter(i => i.status === 'cancelled');

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    const docRef = doc(firestore, 'invoices', updatedInvoice.id);
    updateDocumentNonBlocking(docRef, { status: updatedInvoice.status });
  };


  const handleExport = (invoicesToExport: Invoice[], filename: string) => {
    if (invoicesToExport.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No hay datos para exportar',
        description: 'La pestaña actual no contiene facturas.',
      });
      return;
    }

    const csvHeaders = [
      "ID", "Número Factura", "ID Cliente", "Nombre Cliente", "Subtotal", "Impuesto",
      "Descuento", "Total", "Monto Pagado", "Saldo", "Estado", "Método de Pago", 
      "Notas", "Fecha Vencimiento", "Creado Por", "Fecha Creación"
    ];

    const csvRows = invoicesToExport.map(i => [
      i.id,
      i.invoiceNumber,
      i.customerId,
      `"${i.customerName.replace(/"/g, '""')}"`,
      i.subtotal,
      i.tax,
      i.discount,
      i.total,
      i.paidAmount,
      i.balance,
      i.status,
      i.paymentMethod,
      `"${i.notes.replace(/"/g, '""')}"`,
      i.dueDate.toISOString(),
      `"${i.createdByName.replace(/"/g, '""')}"`,
      i.createdAt.toISOString(),
    ].join(','));

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
        title: "Exportación Completa",
        description: `Los datos de las facturas han sido exportados a ${filename}.`,
    });
  };

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="partial">Parciales</TabsTrigger>
          <TabsTrigger value="paid">Pagadas</TabsTrigger>
          <TabsTrigger value="cancelled" className="hidden sm:flex">
            Canceladas
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          {/* El botón de exportar se moverá a cada pestaña para exportar el contenido filtrado */}
          <Button size="sm" className="h-8 gap-1" disabled>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Añadir Factura
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <InvoicesTable 
          invoices={invoices} 
          title="Todas las Facturas" 
          description="Gestiona todas tus facturas y sigue su estado."
          onExport={() => handleExport(invoices, 'todas_las_facturas.csv')}
          onUpdateInvoice={handleUpdateInvoice}
          isLoading={isLoading}
          firestore={firestore}
        />
      </TabsContent>
      <TabsContent value="pending">
        <InvoicesTable 
          invoices={pendingInvoices} 
          title="Facturas Pendientes" 
          description="Facturas que aún no han recibido ningún pago."
          onExport={() => handleExport(pendingInvoices, 'facturas_pendientes.csv')}
          onUpdateInvoice={handleUpdateInvoice}
          isLoading={isLoading}
          firestore={firestore}
        />
      </TabsContent>
      <TabsContent value="partial">
        <InvoicesTable 
          invoices={partialInvoices} 
          title="Facturas Parciales" 
          description="Facturas que han recibido un pago parcial."
          onExport={() => handleExport(partialInvoices, 'facturas_parciales.csv')}
          onUpdateInvoice={handleUpdateInvoice}
          isLoading={isLoading}
          firestore={firestore}
        />
      </TabsContent>
      <TabsContent value="paid">
        <InvoicesTable 
          invoices={paidInvoices} 
          title="Facturas Pagadas" 
          description="Facturas que han sido pagadas en su totalidad."
          onExport={() => handleExport(paidInvoices, 'facturas_pagadas.csv')}
          onUpdateInvoice={handleUpdateInvoice}
          isLoading={isLoading}
          firestore={firestore}
        />
      </TabsContent>
      <TabsContent value="cancelled">
        <InvoicesTable 
          invoices={cancelledInvoices} 
          title="Facturas Canceladas" 
          description="Facturas que han sido anuladas."
          onExport={() => handleExport(cancelledInvoices, 'facturas_canceladas.csv')}
          onUpdateInvoice={handleUpdateInvoice}
          isLoading={isLoading}
          firestore={firestore}
        />
      </TabsContent>
    </Tabs>
  );
}
