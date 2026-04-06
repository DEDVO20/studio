import 'server-only';

import type { Expense } from '@/lib/types';
import { query } from '@/lib/postgres';

type ExpenseRow = {
  id: string;
  date: Date | string;
  description: string;
  category: string;
  amount: string | number;
  payment_method: string;
  notes: string;
  created_by: string;
  created_by_name: string;
  created_at: Date | string;
  updated_at: Date | string;
};

type ExpenseInput = {
  date: Date;
  description: string;
  category: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  createdBy?: string;
  createdByName?: string;
};

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function asNumber(value: string | number) {
  return typeof value === 'number' ? value : Number(value);
}

function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    date: asDate(row.date),
    description: row.description,
    category: row.category,
    amount: asNumber(row.amount),
    paymentMethod: row.payment_method,
    notes: row.notes,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

export async function listExpenses() {
  const result = await query<ExpenseRow>(
    `
      SELECT
        id, date, description, category, amount, payment_method, notes,
        created_by, created_by_name, created_at, updated_at
      FROM expenses
      ORDER BY date DESC, created_at DESC
    `
  );

  return result.rows.map(mapExpense);
}

export async function createExpense(input: ExpenseInput) {
  const result = await query<ExpenseRow>(
    `
      INSERT INTO expenses (
        date,
        description,
        category,
        amount,
        payment_method,
        notes,
        created_by,
        created_by_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id, date, description, category, amount, payment_method, notes,
        created_by, created_by_name, created_at, updated_at
    `,
    [
      input.date,
      input.description,
      input.category,
      input.amount,
      input.paymentMethod,
      input.notes ?? '',
      input.createdBy ?? '',
      input.createdByName ?? '',
    ]
  );

  return mapExpense(result.rows[0]);
}

export async function updateExpense(expenseId: string, input: ExpenseInput) {
  const result = await query<ExpenseRow>(
    `
      UPDATE expenses
      SET
        date = $2,
        description = $3,
        category = $4,
        amount = $5,
        payment_method = $6,
        notes = $7,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id, date, description, category, amount, payment_method, notes,
        created_by, created_by_name, created_at, updated_at
    `,
    [
      expenseId,
      input.date,
      input.description,
      input.category,
      input.amount,
      input.paymentMethod,
      input.notes ?? '',
    ]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return mapExpense(result.rows[0]);
}

export async function deleteExpense(expenseId: string) {
  await query('DELETE FROM expenses WHERE id = $1', [expenseId]);
}
