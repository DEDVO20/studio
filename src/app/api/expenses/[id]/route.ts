import { NextResponse } from 'next/server';

import { expenseSchema } from '@/lib/schemas';
import { deleteExpense, updateExpense } from '@/lib/postgres-expenses';

export const runtime = 'nodejs';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await context.params;
    const parsed = expenseSchema.parse({
      ...body,
      date: new Date(body.date),
    });

    const expense = await updateExpense(id, parsed);

    if (!expense) {
      return NextResponse.json({ message: 'Gasto no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error('Error updating expense in Postgres:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo actualizar el gasto.' },
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
    await deleteExpense(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting expense in Postgres:', error);
    return NextResponse.json(
      { message: 'No se pudo eliminar el gasto.' },
      { status: 500 }
    );
  }
}
