import { NextResponse } from 'next/server';

import { productSchema } from '@/lib/schemas';
import { createProduct, listProducts } from '@/lib/postgres-products';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const products = await listProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error loading products from Postgres:', error);
    return NextResponse.json({ message: 'No se pudieron cargar los productos.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = productSchema.parse(body);
    const product = await createProduct(parsed);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product in Postgres:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo crear el producto.' },
      { status: 400 }
    );
  }
}
