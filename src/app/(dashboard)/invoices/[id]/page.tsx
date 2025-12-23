'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { mockInvoices, mockCustomers } from '@/lib/data';
import { InvoiceDetails } from '@/components/invoices/invoice-details';
import { PaymentHistory } from '@/components/invoices/payment-history';
import { AddPaymentDialog } from '@/components/invoices/add-payment-dialog';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const invoice = mockInvoices.find((inv) => inv.id === params.id);
  
  if (!invoice) {
    notFound();
  }

  const customer = mockCustomers.find((cust) => cust.id === invoice.customerId);

  if (!customer) {
    // Or handle this case more gracefully
    notFound();
  }

  return (
    <div className="space-y-6">
      <InvoiceDetails 
        invoice={invoice} 
        customer={customer}
        onAddPayment={() => setIsPaymentDialogOpen(true)}
      />
      <PaymentHistory />

      <AddPaymentDialog 
        invoice={invoice}
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
      />
    </div>
  );
}
