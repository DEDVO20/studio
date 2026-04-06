import { NextResponse } from 'next/server';

import { createSale } from '@/lib/postgres-sales';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customerId?: string;
      discount?: number;
      items?: Array<{ productId: string; quantity: number }>;
      createdBy?: string;
      createdByName?: string;
    };

    const invoice = await createSale({
      customerId: body.customerId ?? 'general',
      discount: Number(body.discount ?? 0),
      items: body.items ?? [],
      createdBy: body.createdBy ?? '',
      createdByName: body.createdByName ?? '',
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error('Error creating sale in Postgres:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo procesar la venta.' },
      { status: 400 }
    );
  }
}
