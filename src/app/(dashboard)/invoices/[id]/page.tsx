'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { mockInvoices, mockCustomers, mockPayments } from '@/lib/data';
import { InvoiceDetails } from '@/components/invoices/invoice-details';
import { PaymentHistory } from '@/components/invoices/payment-history';
import { AddPaymentDialog } from '@/components/invoices/add-payment-dialog';
import type { Customer, Invoice, Payment } from '@/lib/types';
import type { z } from 'zod';
import type { addPaymentSchema } from '@/lib/schemas';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  // We use local state to simulate DB updates for the demo
  const [invoices, setInvoices] = useState(mockInvoices);
  const [payments, setPayments] = useState(mockPayments);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const invoice = invoices.find((inv) => inv.id === params.id);
  
  if (!invoice) {
    notFound();
  }

  const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);

  let customer: Customer | undefined;

  if (invoice.customerId === 'general') {
    // Create a dummy customer object for general sales
    customer = {
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
    };
  } else {
    customer = mockCustomers.find((cust) => cust.id === invoice.customerId);
  }


  if (!customer) {
    // Or handle this case more gracefully
    notFound();
  }

  const handleSavePayment = (paymentData: z.infer<typeof addPaymentSchema>) => {
    // 1. Create new payment record
    const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference || '',
        notes: paymentData.notes || '',
        createdBy: 'user-1',
        createdByName: 'Usuario Administrador',
        createdAt: new Date(),
    };
    setPayments(prev => [newPayment, ...prev]);

    // 2. Update invoice
    const updatedInvoice: Invoice = {
        ...invoice,
        paidAmount: invoice.paidAmount + paymentData.amount,
        balance: invoice.balance - paymentData.amount,
        updatedAt: new Date(),
    };

    if (updatedInvoice.balance <= 0) {
        updatedInvoice.status = 'paid';
        updatedInvoice.balance = 0; // Ensure it doesn't go negative
    } else {
        updatedInvoice.status = 'partial';
    }
    
    setInvoices(prev => prev.map(inv => inv.id === invoice.id ? updatedInvoice : inv));

    setIsPaymentDialogOpen(false);
  };


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
