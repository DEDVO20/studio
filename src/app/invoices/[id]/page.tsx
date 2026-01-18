'use client';

import { useState, useMemo, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import {
  collection,
  doc,
  query,
  where,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import {
  useDoc,
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { InvoiceDetails } from '@/components/invoices/invoice-details';
import { PaymentHistory } from '@/components/invoices/payment-history';
import { AddPaymentDialog } from '@/components/invoices/add-payment-dialog';
import type { Customer, Invoice, Payment } from '@/lib/types';
import type { z } from 'zod';
import type { addPaymentSchema } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export default function InvoiceDetailPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const params = useParams();
  const id = params.id as string;

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  // State to handle potential race condition on creation
  const [isLikelyCreation, setIsLikelyCreation] = useState(true);


  // Fetch invoice
  const invoiceRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'invoices', id) : null),
    [firestore, id]
  );
  const { data: invoiceData, isLoading: isLoadingInvoice } = useDoc<Invoice>(invoiceRef);

  // After 2 seconds, we assume it's a real 404 if data hasn't loaded.
  useEffect(() => {
    const timer = setTimeout(() => {
        setIsLikelyCreation(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Fetch customer for the invoice
  const customerRef = useMemoFirebase(() => {
    if (!firestore || !invoiceData?.customerId || invoiceData.customerId === 'general') return null;
    return doc(firestore, 'customers', invoiceData.customerId);
  }, [firestore, invoiceData]);
  const { data: customerData, isLoading: isLoadingCustomer } = useDoc<Customer>(customerRef);

  // Fetch payments for the invoice
  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'payments'), where('invoiceId', '==', id));
  }, [firestore, id]);
  const { data: paymentsData, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);
  
  const invoice = useMemo<Invoice | null>(() => {
    if (!invoiceData) return null;
    return {
      ...invoiceData,
      createdAt: (invoiceData.createdAt as any)?.toDate ? (invoiceData.createdAt as any).toDate() : new Date(),
      updatedAt: (invoiceData.updatedAt as any)?.toDate ? (invoiceData.updatedAt as any).toDate() : new Date(),
      dueDate: (invoiceData.dueDate as any)?.toDate ? (invoiceData.dueDate as any).toDate() : new Date(),
    };
  }, [invoiceData]);

  const customer = useMemo<Customer | null>(() => {
    if (invoiceData?.customerId === 'general') {
      return {
        id: 'general', name: 'Cliente General', email: '', phone: '', address: '', taxId: '',
        creditLimit: 0, currentBalance: 0, createdAt: new Date(), updatedAt: new Date(),
      };
    }
    return customerData ? {
        ...customerData,
        createdAt: (customerData.createdAt as any)?.toDate ? (customerData.createdAt as any).toDate() : new Date(),
        updatedAt: (customerData.updatedAt as any)?.toDate ? (customerData.updatedAt as any).toDate() : new Date(),
    } : null;
  }, [customerData, invoiceData]);
  
  const invoicePayments = useMemo<Payment[]>(() => {
    if (!paymentsData) return [];
    return paymentsData.map(p => ({
        ...p,
        createdAt: (p.createdAt as any)?.toDate ? (p.createdAt as any).toDate() : new Date(),
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [paymentsData]);


  const handleSavePayment = async (paymentData: z.infer<typeof addPaymentSchema>) => {
    if (!user || !invoice || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo procesar el pago. Faltan datos.' });
      return;
    }

    const newPaymentData: Omit<Payment, 'id' | 'createdAt'> = {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference || '',
        notes: paymentData.notes || '',
        createdBy: user.uid,
        createdByName: user.displayName || 'Usuario Anónimo',
    };

    try {
        await runTransaction(firestore, async (transaction) => {
            const invoiceDocRef = doc(firestore, 'invoices', invoice.id);
            const invoiceDoc = await transaction.get(invoiceDocRef);

            if (!invoiceDoc.exists()) {
                throw "La factura no existe.";
            }

            const currentInvoice = invoiceDoc.data() as Invoice;
            const newPaidAmount = currentInvoice.paidAmount + paymentData.amount;
            const newBalance = currentInvoice.total - newPaidAmount;
            const newStatus = newBalance <= 0 ? 'paid' : 'partial';

            // 1. Update invoice
            transaction.update(invoiceDocRef, {
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: newStatus,
                updatedAt: serverTimestamp(),
            });

            // 2. Create new payment record
            const paymentCollectionRef = collection(firestore, 'payments');
            const newPaymentRef = doc(paymentCollectionRef); // Auto-generate ID
            transaction.set(newPaymentRef, { ...newPaymentData, createdAt: serverTimestamp() });

             // 3. Update customer balance if not general
             if (invoice.customerId !== 'general' && invoice.customerId) {
                const customerDocRef = doc(firestore, 'customers', invoice.customerId);
                const customerDoc = await transaction.get(customerDocRef);
                if (customerDoc.exists()) {
                    const currentBalance = customerDoc.data().currentBalance || 0;
                    transaction.update(customerDocRef, {
                        currentBalance: currentBalance - paymentData.amount,
                    });
                }
            }
        });

        toast({
            title: "Pago Registrado",
            description: `El pago de $${paymentData.amount.toLocaleString('es-CO')} se ha registrado correctamente.`,
        });

        setIsPaymentDialogOpen(false);
    } catch (e: any) {
        console.error("Error al registrar el pago: ", e);
        toast({
            variant: "destructive",
            title: "Error en la transacción",
            description: e.message || "No se pudo guardar el pago. Por favor, inténtalo de nuevo.",
        });
    }
  };

  const isLoading = isLoadingInvoice || (invoiceData && (isLoadingCustomer || isLoadingPayments));

  // Show skeleton while loading main invoice or subsequent data
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
                 <Skeleton className="h-10 w-24 ml-auto" />
                 <Skeleton className="h-10 w-36 ml-2" />
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

  // Handle "Not Found" state
  if (!isLoadingInvoice && !invoice) {
    if (isLikelyCreation) {
      // If we got here quickly, it might be the race condition. Show a spinner.
      return (
        <div className="flex h-64 w-full items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando factura...</span>
        </div>
      );
    }
    // If we've waited and there's still no invoice, it's a genuine 404.
    notFound();
  }

  if (!invoice || !customer) {
    // This state can be hit if the customer doc doesn't exist for the invoice's customerId
    return (
        <div className="flex h-64 w-full items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando datos del cliente...</span>
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
      <PaymentHistory payments={invoicePayments} />

      <AddPaymentDialog 
        invoice={invoice}
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        onSave={handleSavePayment}
      />
    </div>
  );
}
