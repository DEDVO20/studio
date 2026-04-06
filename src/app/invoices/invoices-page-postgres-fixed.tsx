'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart } from 'lucide-react';

import { InvoicesTable } from '@/components/invoices/invoices-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { Customer, Invoice } from '@/lib/types';

export default function InvoicesPagePostgresFixed() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInvoices = async () => {
    setIsLoading(true);

    try {
      const [invoiceResponse, customerResponse] = await Promise.all([
        fetch('/api/invoices', { method: 'GET', cache: 'no-store' }),
        fetch('/api/customers', { method: 'GET', cache: 'no-store' }),
      ]);

      if (!invoiceResponse.ok) {
        throw new Error('No se pudieron cargar las facturas.');
      }

      if (!customerResponse.ok) {
        throw new Error('No se pudieron cargar los clientes.');
      }

      const invoiceBody = (await invoiceResponse.json()) as { invoices: Invoice[] };
      const customerBody = (await customerResponse.json()) as { customers: Customer[] };

      setInvoices(invoiceBody.invoices);
      setCustomers(customerBody.customers);
    } catch (error) {
      console.error('Error loading invoices page from Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudieron cargar las facturas.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    const sortedInvoices = [...invoices].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    if (!searchTerm) {
      return sortedInvoices;
    }

    const lowered = searchTerm.toLowerCase();
    return sortedInvoices.filter(
      (invoice) =>
        invoice.customerName.toLowerCase().includes(lowered) ||
        invoice.invoiceNumber.toLowerCase().includes(lowered)
    );
  }, [invoices, searchTerm]);

  const pendingInvoices = filteredInvoices.filter((invoice) => invoice.status === 'pending');
  const partialInvoices = filteredInvoices.filter((invoice) => invoice.status === 'partial');
  const paidInvoices = filteredInvoices.filter((invoice) => invoice.status === 'paid');
  const cancelledInvoices = filteredInvoices.filter((invoice) => invoice.status === 'cancelled');

  const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
    const response = await fetch(`/api/invoices/${updatedInvoice.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: updatedInvoice.status }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(body?.message || 'No se pudo actualizar la factura.');
    }

    await loadInvoices();
  };

  const loadCustomerById = async (customerId: string) => {
    if (customerId === 'general') {
      return {
        id: 'general',
        name: 'Cliente General',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        creditLimit: 0,
        currentBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Customer;
    }

    return customers.find((customer) => customer.id === customerId);
  };

  const handleExport = (invoicesToExport: Invoice[], filename: string) => {
    if (!invoicesToExport.length) {
      toast({
        variant: 'destructive',
        title: 'No hay datos para exportar',
        description: 'La pestana actual no contiene facturas.',
      });
      return;
    }

    const csvHeaders = [
      'ID',
      'Numero Factura',
      'ID Cliente',
      'Nombre Cliente',
      'Subtotal',
      'Impuesto',
      'Descuento',
      'Total',
      'Monto Pagado',
      'Saldo',
      'Estado',
      'Metodo de Pago',
      'Notas',
      'Fecha Vencimiento',
      'Creado Por',
      'Fecha Creacion',
    ];

    const csvRows = invoicesToExport.map((invoice) =>
      [
        invoice.id,
        invoice.invoiceNumber,
        invoice.customerId,
        `"${invoice.customerName.replace(/"/g, '""')}"`,
        invoice.subtotal,
        invoice.tax,
        invoice.discount,
        invoice.total,
        invoice.paidAmount,
        invoice.balance,
        invoice.status,
        invoice.paymentMethod,
        `"${invoice.notes.replace(/"/g, '""')}"`,
        invoice.dueDate.toISOString(),
        `"${invoice.createdByName.replace(/"/g, '""')}"`,
        invoice.createdAt.toISOString(),
      ].join(',')
    );

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
      title: 'Exportacion completa',
      description: `Los datos de las facturas han sido exportados a ${filename}.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por cliente o N. de factura..."
            className="w-full rounded-lg bg-background pl-8 md:w-2/3 lg:w-1/3"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" className="h-8 gap-1">
            <Link href="/pos">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Ir al POS</span>
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 gap-2 sm:grid-cols-5">
          <TabsTrigger value="all">Todas ({filteredInvoices.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendientes ({pendingInvoices.length})</TabsTrigger>
          <TabsTrigger value="partial">Parciales ({partialInvoices.length})</TabsTrigger>
          <TabsTrigger value="paid">Pagadas ({paidInvoices.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Canceladas ({cancelledInvoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <InvoicesTable
            invoices={filteredInvoices}
            title="Todas las Facturas"
            description="Gestiona todas tus facturas y sigue su estado."
            onExport={() => handleExport(filteredInvoices, 'todas_las_facturas.csv')}
            onUpdateInvoice={handleUpdateInvoice}
            isLoading={isLoading}
            loadCustomerById={loadCustomerById}
          />
        </TabsContent>

        <TabsContent value="pending">
          <InvoicesTable
            invoices={pendingInvoices}
            title="Facturas Pendientes"
            description="Facturas que aun no han recibido ningun pago."
            onExport={() => handleExport(pendingInvoices, 'facturas_pendientes.csv')}
            onUpdateInvoice={handleUpdateInvoice}
            isLoading={isLoading}
            loadCustomerById={loadCustomerById}
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
            loadCustomerById={loadCustomerById}
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
            loadCustomerById={loadCustomerById}
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
            loadCustomerById={loadCustomerById}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
