import { NextResponse } from 'next/server';

import { listInventoryMovements } from '@/lib/postgres-inventory';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const movements = await listInventoryMovements(id);
    return NextResponse.json({ movements });
  } catch (error) {
    console.error('Error loading inventory movements from Postgres:', error);
    return NextResponse.json(
      { message: 'No se pudo cargar el historial del producto.' },
      { status: 500 }
    );
  }
}
