import { NextResponse } from 'next/server';

import { updateInvoiceStatus } from '@/lib/postgres-invoices';
import type { Invoice } from '@/lib/types';

export const runtime = 'nodejs';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = (await request.json()) as { status?: Invoice['status'] };
    const { id } = await context.params;

    if (!body.status) {
      return NextResponse.json({ message: 'El estado es obligatorio.' }, { status: 400 });
    }

    const invoice = await updateInvoiceStatus(id, body.status);

    if (!invoice) {
      return NextResponse.json({ message: 'Factura no encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Error updating invoice status in Postgres:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo actualizar la factura.' },
      { status: 400 }
    );
  }
}
