import 'server-only';

import type { PoolClient } from 'pg';

import type { Customer, Invoice, InvoiceItem, Payment } from '@/lib/types';
import { query, withTransaction } from '@/lib/postgres';

type InvoiceRow = {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  items: InvoiceItem[];
  subtotal: string | number;
  tax: string | number;
  discount: string | number;
  total: string | number;
  paid_amount: string | number;
  balance: string | number;
  status: Invoice['status'];
  payment_method: string;
  notes: string;
  due_date: Date | string;
  created_by: string;
  created_by_name: string;
  created_at: Date | string;
  updated_at: Date | string;
};

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

type PaymentRow = {
  id: string;
  invoice_id: string;
  invoice_number: string;
  amount: string | number;
  payment_method: string;
  reference: string;
  notes: string;
  created_by: string;
  created_by_name: string;
  created_at: Date | string;
};

type ProductRow = {
  id: string;
  name: string;
  stock: number;
};

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function asNumber(value: string | number) {
  return typeof value === 'number' ? value : Number(value);
}

function mapInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    items: row.items ?? [],
    subtotal: asNumber(row.subtotal),
    tax: asNumber(row.tax),
    discount: asNumber(row.discount),
    total: asNumber(row.total),
    paidAmount: asNumber(row.paid_amount),
    balance: asNumber(row.balance),
    status: row.status,
    paymentMethod: row.payment_method,
    notes: row.notes,
    dueDate: asDate(row.due_date),
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
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

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number,
    amount: asNumber(row.amount),
    paymentMethod: row.payment_method,
    reference: row.reference,
    notes: row.notes,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: asDate(row.created_at),
  };
}

function getGeneralCustomer(): Customer {
  const now = new Date();

  return {
    id: 'general',
    name: 'Cliente General',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    creditLimit: 0,
    currentBalance: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getInvoiceDetail(invoiceId: string) {
  const invoiceResult = await query<InvoiceRow>(
    `
      SELECT
        id,
        invoice_number,
        customer_id,
        customer_name,
        items,
        subtotal,
        tax,
        discount,
        total,
        paid_amount,
        balance,
        status,
        payment_method,
        notes,
        due_date,
        created_by,
        created_by_name,
        created_at,
        updated_at
      FROM invoices
      WHERE id = $1
      LIMIT 1
    `,
    [invoiceId]
  );

  if (invoiceResult.rowCount === 0) {
    return null;
  }

  const invoice = mapInvoice(invoiceResult.rows[0]);

  let customer = getGeneralCustomer();
  if (invoice.customerId !== 'general') {
    const customerResult = await query<CustomerRow>(
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
        WHERE id = $1
        LIMIT 1
      `,
      [invoice.customerId]
    );

    if ((customerResult.rowCount ?? 0) > 0) {
      customer = mapCustomer(customerResult.rows[0]);
    }
  }

  const paymentResult = await query<PaymentRow>(
    `
      SELECT
        id,
        invoice_id,
        invoice_number,
        amount,
        payment_method,
        reference,
        notes,
        created_by,
        created_by_name,
        created_at
      FROM payments
      WHERE invoice_id = $1
      ORDER BY created_at DESC
    `,
    [invoiceId]
  );

  return {
    invoice,
    customer,
    payments: paymentResult.rows.map(mapPayment),
  };
}

export async function listInvoices() {
  const result = await query<InvoiceRow>(
    `
      SELECT
        id,
        invoice_number,
        customer_id,
        customer_name,
        items,
        subtotal,
        tax,
        discount,
        total,
        paid_amount,
        balance,
        status,
        payment_method,
        notes,
        due_date,
        created_by,
        created_by_name,
        created_at,
        updated_at
      FROM invoices
      ORDER BY created_at DESC
    `
  );

  return result.rows.map(mapInvoice);
}

export async function updateInvoiceStatus(invoiceId: string, status: Invoice['status']) {
  if (status !== 'cancelled') {
    const result = await query<InvoiceRow>(
      `
        UPDATE invoices
        SET status = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          invoice_number,
          customer_id,
          customer_name,
          items,
          subtotal,
          tax,
          discount,
          total,
          paid_amount,
          balance,
          status,
          payment_method,
          notes,
          due_date,
          created_by,
          created_by_name,
          created_at,
          updated_at
      `,
      [invoiceId, status]
    );

    if ((result.rowCount ?? 0) === 0) {
      return null;
    }

    return mapInvoice(result.rows[0]);
  }

  return withTransaction(async (client) => {
    const lockedInvoice = await getLockedInvoice(client, invoiceId);

    if (!lockedInvoice) {
      return null;
    }

    const currentInvoice = mapInvoice(lockedInvoice);

    if (currentInvoice.status === 'cancelled') {
      return currentInvoice;
    }

    if (currentInvoice.paidAmount > 0 || currentInvoice.status === 'partial') {
      throw new Error(
        'No se puede cancelar una factura con pagos registrados. Debes revertir o devolver esos pagos primero.'
      );
    }

    for (const item of currentInvoice.items) {
      const productResult = await client.query<ProductRow>(
        `
          SELECT id, name, stock
          FROM products
          WHERE id = $1
          FOR UPDATE
        `,
        [item.productId]
      );

      if ((productResult.rowCount ?? 0) === 0) {
        throw new Error(`No se pudo revertir stock para el producto ${item.productName}.`);
      }

      const product = productResult.rows[0];
      const previousStock = product.stock;
      const newStock = previousStock + item.quantity;

      await client.query(
        `
          UPDATE products
          SET stock = $2, updated_at = NOW()
          WHERE id = $1
        `,
        [product.id, newStock]
      );

      await client.query(
        `
          INSERT INTO inventory_movements (
            product_id,
            product_name,
            type,
            quantity,
            previous_stock,
            new_stock,
            reference,
            notes,
            created_by,
            created_by_name
          )
          VALUES ($1, $2, 'return', $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          product.id,
          product.name,
          item.quantity,
          previousStock,
          newStock,
          currentInvoice.invoiceNumber,
          'Reversion de stock por cancelacion de factura.',
          currentInvoice.createdBy,
          currentInvoice.createdByName,
        ]
      );
    }

    if (currentInvoice.customerId !== 'general' && currentInvoice.balance > 0) {
      await client.query(
        `
          UPDATE customers
          SET
            current_balance = GREATEST(current_balance - $2, 0),
            updated_at = NOW()
          WHERE id = $1
        `,
        [currentInvoice.customerId, currentInvoice.balance]
      );
    }

    const result = await client.query<InvoiceRow>(
      `
        UPDATE invoices
        SET
          status = 'cancelled',
          balance = 0,
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          invoice_number,
          customer_id,
          customer_name,
          items,
          subtotal,
          tax,
          discount,
          total,
          paid_amount,
          balance,
          status,
          payment_method,
          notes,
          due_date,
          created_by,
          created_by_name,
          created_at,
          updated_at
      `,
      [invoiceId]
    );

    return result.rows[0] ? mapInvoice(result.rows[0]) : null;
  });
}

type CreateInvoicePaymentInput = {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdByName: string;
};

async function getLockedInvoice(client: PoolClient, invoiceId: string) {
  const result = await client.query<InvoiceRow>(
    `
      SELECT
        id,
        invoice_number,
        customer_id,
        customer_name,
        items,
        subtotal,
        tax,
        discount,
        total,
        paid_amount,
        balance,
        status,
        payment_method,
        notes,
        due_date,
        created_by,
        created_by_name,
        created_at,
        updated_at
      FROM invoices
      WHERE id = $1
      FOR UPDATE
    `,
    [invoiceId]
  );

  return result.rows[0] ?? null;
}

export async function createInvoicePayment(input: CreateInvoicePaymentInput) {
  return withTransaction(async (client) => {
    const currentInvoiceRow = await getLockedInvoice(client, input.invoiceId);

    if (!currentInvoiceRow) {
      throw new Error('La factura no existe.');
    }

    const currentInvoice = mapInvoice(currentInvoiceRow);

    if (input.amount <= 0) {
      throw new Error('El monto del pago debe ser mayor a cero.');
    }

    if (input.amount > currentInvoice.balance) {
      throw new Error('El pago no puede ser mayor que el saldo pendiente de la factura.');
    }

    const newPaidAmount = currentInvoice.paidAmount + input.amount;
    const newBalance = currentInvoice.total - newPaidAmount;
    const newStatus: Invoice['status'] = newBalance <= 0 ? 'paid' : 'partial';

    await client.query(
      `
        UPDATE invoices
        SET
          paid_amount = $2,
          balance = $3,
          status = $4,
          updated_at = NOW()
        WHERE id = $1
      `,
      [input.invoiceId, newPaidAmount, newBalance, newStatus]
    );

    await client.query(
      `
        INSERT INTO payments (
          invoice_id,
          invoice_number,
          amount,
          payment_method,
          reference,
          notes,
          created_by,
          created_by_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        input.invoiceId,
        currentInvoice.invoiceNumber,
        input.amount,
        input.paymentMethod,
        input.reference ?? '',
        input.notes ?? '',
        input.createdBy,
        input.createdByName,
      ]
    );

    if (currentInvoice.customerId !== 'general') {
      await client.query(
        `
          UPDATE customers
          SET
            current_balance = current_balance - $2,
            updated_at = NOW()
          WHERE id = $1
        `,
        [currentInvoice.customerId, input.amount]
      );
    }

    return getInvoiceDetail(input.invoiceId);
  });
}
