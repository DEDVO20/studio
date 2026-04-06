import { NextResponse } from 'next/server';

import { createInvoicePayment } from '@/lib/postgres-invoices';
import { addPaymentSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await context.params;
    const parsedPayment = addPaymentSchema.parse(body);

    if (!body.createdBy || !body.createdByName) {
      return NextResponse.json(
        { message: 'createdBy y createdByName son obligatorios.' },
        { status: 400 }
      );
    }

    const detail = await createInvoicePayment({
      invoiceId: id,
      amount: parsedPayment.amount,
      paymentMethod: parsedPayment.paymentMethod,
      reference: parsedPayment.reference,
      notes: parsedPayment.notes,
      createdBy: body.createdBy,
      createdByName: body.createdByName,
    });

    return NextResponse.json(detail);
  } catch (error) {
    console.error('Error creating invoice payment in Postgres:', error);

    const message =
      error instanceof Error ? error.message : 'No se pudo registrar el pago en Postgres.';

    return NextResponse.json({ message }, { status: 400 });
  }
}
