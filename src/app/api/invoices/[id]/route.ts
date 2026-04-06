import { NextResponse } from 'next/server';

import { getInvoiceDetail } from '@/lib/postgres-invoices';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const detail = await getInvoiceDetail(id);

    if (!detail) {
      return NextResponse.json({ message: 'Invoice not found.' }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error('Error loading invoice detail from Postgres:', error);
    return NextResponse.json(
      { message: 'No se pudo cargar la factura desde Postgres.' },
      { status: 500 }
    );
  }
}
