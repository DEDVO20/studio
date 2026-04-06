import { NextResponse } from 'next/server';

import { customerSchema } from '@/lib/schemas';
import { deleteCustomer, listInvoicesForCustomer, updateCustomer } from '@/lib/postgres-customers';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const invoices = await listInvoicesForCustomer(id);
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error loading customer invoices from Postgres:', error);
    return NextResponse.json(
      { message: 'No se pudo cargar el historial del cliente.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await context.params;
    const parsed = customerSchema.parse(body);
    const customer = await updateCustomer(id, parsed);

    if (!customer) {
      return NextResponse.json({ message: 'Cliente no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error updating customer in Postgres:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo actualizar el cliente.' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await deleteCustomer(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting customer in Postgres:', error);
    return NextResponse.json({ message: 'No se pudo eliminar el cliente.' }, { status: 500 });
  }
}
