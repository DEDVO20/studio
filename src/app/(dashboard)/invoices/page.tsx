'use client';

import { File, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { InvoicesTable } from '@/components/invoices/invoices-table';
import { mockInvoices } from '@/lib/data';
import type { Invoice } from '@/lib/types';

export default function InvoicesPage() {
  const allInvoices: Invoice[] = mockInvoices;
  const pendingInvoices = allInvoices.filter(i => i.status === 'pending');
  const partialInvoices = allInvoices.filter(i => i.status === 'partial');
  const paidInvoices = allInvoices.filter(i => i.status === 'paid');
  const cancelledInvoices = allInvoices.filter(i => i.status === 'cancelled');

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
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Exportar
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Añadir Factura
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <InvoicesTable invoices={allInvoices} title="Todas las Facturas" description="Gestiona todas tus facturas y sigue su estado."/>
      </TabsContent>
      <TabsContent value="pending">
        <InvoicesTable invoices={pendingInvoices} title="Facturas Pendientes" description="Facturas que aún no han recibido ningún pago."/>
      </TabsContent>
      <TabsContent value="partial">
        <InvoicesTable invoices={partialInvoices} title="Facturas Parciales" description="Facturas que han recibido un pago parcial."/>
      </TabsContent>
      <TabsContent value="paid">
        <InvoicesTable invoices={paidInvoices} title="Facturas Pagadas" description="Facturas que han sido pagadas en su totalidad."/>
      </TabsContent>
      <TabsContent value="cancelled">
        <InvoicesTable invoices={cancelledInvoices} title="Facturas Canceladas" description="Facturas que han sido anuladas."/>
      </TabsContent>
    </Tabs>
  );
}
