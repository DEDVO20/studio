import { NextResponse } from 'next/server';

import { adjustmentSchema } from '@/lib/schemas';
import {
  createInventoryAdjustment,
  listInventoryProducts,
} from '@/lib/postgres-inventory';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const products = await listInventoryProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error loading inventory products from Postgres:', error);
    return NextResponse.json(
      { message: 'No se pudo cargar el inventario.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = adjustmentSchema.parse(body);

    if (!body.createdBy || !body.createdByName) {
      return NextResponse.json(
        { message: 'createdBy y createdByName son obligatorios.' },
        { status: 400 }
      );
    }

    const adjustment = await createInventoryAdjustment({
      productId: parsed.productId,
      type: parsed.type,
      quantity: parsed.quantity,
      notes: parsed.notes,
      createdBy: body.createdBy,
      createdByName: body.createdByName,
    });

    return NextResponse.json(adjustment, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory adjustment in Postgres:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo guardar el ajuste.' },
      { status: 400 }
    );
  }
}
