import { NextResponse } from 'next/server';

import { customerSchema } from '@/lib/schemas';
import { createCustomer, listCustomers } from '@/lib/postgres-customers';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const customers = await listCustomers();
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error loading customers from Postgres:', error);
    return NextResponse.json({ message: 'No se pudieron cargar los clientes.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = customerSchema.parse(body);
    const customer = await createCustomer(parsed);
    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer in Postgres:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo crear el cliente.' },
      { status: 400 }
    );
  }
}
