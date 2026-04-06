import { NextResponse } from 'next/server';

import { productSchema } from '@/lib/schemas';
import { deleteProduct, updateProduct } from '@/lib/postgres-products';

export const runtime = 'nodejs';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await context.params;
    const parsed = productSchema.parse(body);
    const product = await updateProduct(id, parsed);

    if (!product) {
      return NextResponse.json({ message: 'Producto no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error updating product in Postgres:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo actualizar el producto.' },
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
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting product in Postgres:', error);
    return NextResponse.json({ message: 'No se pudo eliminar el producto.' }, { status: 500 });
  }
}
