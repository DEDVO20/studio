'use client';

import { useCallback, useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { z } from 'zod';

import { AddPaymentDialog } from '@/components/invoices/add-payment-dialog';
import { InvoiceDetails } from '@/components/invoices/invoice-details';
import { PaymentHistory } from '@/components/invoices/payment-history';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import type { addPaymentSchema } from '@/lib/schemas';
import type { Customer, Invoice, Payment } from '@/lib/types';

type InvoiceDetailResponse = {
  invoice: Invoice;
  customer: Customer;
  payments: Payment[];
};

export default function InvoiceDetailPagePostgres() {
  const { toast } = useToast();
  const { profile: user } = useUserProfile();
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const loadInvoiceDetail = useCallback(async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setIsNotFound(false);

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.status === 404) {
        setInvoice(null);
        setCustomer(null);
        setPayments([]);
        setIsNotFound(true);
        return;
      }

      if (!response.ok) {
        throw new Error('No se pudo cargar la factura.');
      }

      const detail = (await response.json()) as InvoiceDetailResponse;
      setInvoice(detail.invoice);
      setCustomer(detail.customer);
      setPayments(detail.payments);
    } catch (error) {
      console.error('Error loading invoice detail from Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar la factura desde Postgres.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void loadInvoiceDetail();
  }, [loadInvoiceDetail]);

  const handleSavePayment = async (paymentData: z.infer<typeof addPaymentSchema>) => {
    if (!user || !invoice) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo procesar el pago. Faltan datos.',
      });
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentData,
          createdBy: user.id,
          createdByName: user.displayName || 'Usuario Anónimo',
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(errorBody?.message || 'No se pudo guardar el pago.');
      }

      const detail = (await response.json()) as InvoiceDetailResponse;
      setInvoice(detail.invoice);
      setCustomer(detail.customer);
      setPayments(detail.payments);
      setIsPaymentDialogOpen(false);

      toast({
        title: 'Pago Registrado',
        description: `El pago de $${paymentData.amount.toLocaleString('es-CO')} se ha registrado correctamente.`,
      });
    } catch (error) {
      console.error('Error al registrar el pago:', error);
      toast({
        variant: 'destructive',
        title: 'Error en la transacción',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo guardar el pago. Por favor, inténtalo de nuevo.',
      });
      throw error;
    }
  };

  if (isLoading && !invoice) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="ml-auto h-10 w-24" />
            <Skeleton className="ml-2 h-10 w-36" />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isNotFound) {
    notFound();
  }

  if (!invoice || !customer) {
    return (
      <div className="flex h-64 w-full items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Cargando datos desde Postgres...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InvoiceDetails
        invoice={invoice}
        customer={customer}
        onAddPayment={() => setIsPaymentDialogOpen(true)}
      />
      <PaymentHistory payments={payments} />

      <AddPaymentDialog
        invoice={invoice}
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        onSave={handleSavePayment}
      />
    </div>
  );
}
