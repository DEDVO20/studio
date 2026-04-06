import 'server-only';

import type { Customer, Invoice } from '@/lib/types';
import { query } from '@/lib/postgres';

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  credit_limit: string | number;
  current_balance: string | number;
  created_at: Date | string;
  updated_at: Date | string;
};

type CustomerInput = {
  name: string;
  email: string;
  phone: string;
  address?: string;
  taxId?: string;
  creditLimit: number;
};

type CustomerInvoiceRow = {
  id: string;
  invoice_number: string;
  total: string | number;
  status: Invoice['status'];
  created_at: Date | string;
};

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function asNumber(value: string | number) {
  return typeof value === 'number' ? value : Number(value);
}

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    taxId: row.tax_id,
    creditLimit: asNumber(row.credit_limit),
    currentBalance: asNumber(row.current_balance),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

function mapInvoice(row: CustomerInvoiceRow): Invoice {
  const createdAt = asDate(row.created_at);
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerId: '',
    customerName: '',
    items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: asNumber(row.total),
    paidAmount: 0,
    balance: 0,
    status: row.status,
    paymentMethod: '',
    notes: '',
    dueDate: createdAt,
    createdBy: '',
    createdByName: '',
    createdAt,
    updatedAt: createdAt,
  };
}

export async function listCustomers() {
  const result = await query<CustomerRow>(
    `
      SELECT
        id,
        name,
        email,
        phone,
        address,
        tax_id,
        credit_limit,
        current_balance,
        created_at,
        updated_at
      FROM customers
      ORDER BY created_at DESC
    `
  );

  return result.rows.map(mapCustomer);
}

export async function createCustomer(input: CustomerInput) {
  const result = await query<CustomerRow>(
    `
      INSERT INTO customers (
        name,
        email,
        phone,
        address,
        tax_id,
        credit_limit,
        current_balance
      )
      VALUES ($1, $2, $3, $4, $5, $6, 0)
      RETURNING
        id,
        name,
        email,
        phone,
        address,
        tax_id,
        credit_limit,
        current_balance,
        created_at,
        updated_at
    `,
    [input.name, input.email, input.phone, input.address ?? '', input.taxId ?? '', input.creditLimit]
  );

  return mapCustomer(result.rows[0]);
}

export async function updateCustomer(customerId: string, input: CustomerInput) {
  const result = await query<CustomerRow>(
    `
      UPDATE customers
      SET
        name = $2,
        email = $3,
        phone = $4,
        address = $5,
        tax_id = $6,
        credit_limit = $7,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        name,
        email,
        phone,
        address,
        tax_id,
        credit_limit,
        current_balance,
        created_at,
        updated_at
    `,
    [customerId, input.name, input.email, input.phone, input.address ?? '', input.taxId ?? '', input.creditLimit]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return mapCustomer(result.rows[0]);
}

export async function deleteCustomer(customerId: string) {
  await query('DELETE FROM customers WHERE id = $1', [customerId]);
}

export async function listInvoicesForCustomer(customerId: string) {
  const result = await query<CustomerInvoiceRow>(
    `
      SELECT
        id,
        invoice_number,
        total,
        status,
        created_at
      FROM invoices
      WHERE customer_id = $1
      ORDER BY created_at DESC
    `,
    [customerId]
  );

  return result.rows.map(mapInvoice);
}
