import { NextResponse } from 'next/server';

import { expenseSchema } from '@/lib/schemas';
import { createExpense, listExpenses } from '@/lib/postgres-expenses';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const expenses = await listExpenses();
    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Error loading expenses from Postgres:', error);
    return NextResponse.json(
      { message: 'No se pudieron cargar los gastos.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = expenseSchema.parse({
      ...body,
      date: new Date(body.date),
    });

    const expense = await createExpense({
      ...parsed,
      createdBy: body.createdBy,
      createdByName: body.createdByName,
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error('Error creating expense in Postgres:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo crear el gasto.' },
      { status: 400 }
    );
  }
}
