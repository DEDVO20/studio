import { NextResponse } from 'next/server';

import { listInvoices } from '@/lib/postgres-invoices';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const invoices = await listInvoices();
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error loading invoices from Postgres:', error);
    return NextResponse.json({ message: 'No se pudieron cargar las facturas.' }, { status: 500 });
  }
}
