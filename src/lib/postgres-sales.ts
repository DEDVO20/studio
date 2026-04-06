import 'server-only';

import { getAppSettings } from '@/lib/postgres-settings';
import type { Invoice, InvoiceItem, Product, Customer } from '@/lib/types';
import { query, withTransaction } from '@/lib/postgres';

type ProductRow = {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode: string;
  price: string | number;
  cost: string | number;
  tax_rate: string | number;
  stock: number;
  min_stock: number;
  category: string;
  supplier: string;
  image_url: string;
  is_active: boolean;
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

type CreateSaleInput = {
  customerId: string;
  discount: number;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  createdBy: string;
  createdByName: string;
};

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function asNumber(value: string | number) {
  return typeof value === 'number' ? value : Number(value);
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sku: row.sku,
    barcode: row.barcode,
    price: asNumber(row.price),
    cost: asNumber(row.cost),
    taxRate: asNumber(row.tax_rate),
    stock: row.stock,
    minStock: row.min_stock,
    category: row.category,
    supplier: row.supplier,
    imageUrl: row.image_url,
    isActive: row.is_active,
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

export async function listActiveProducts() {
  const result = await query<ProductRow>(
    `
      SELECT
        id, name, description, sku, barcode, price, cost, tax_rate, stock, min_stock,
        category, supplier, image_url, is_active, created_at, updated_at
      FROM products
      WHERE is_active = TRUE
      ORDER BY name ASC
    `
  );

  return result.rows.map(mapProduct);
}

export async function listAllCustomers() {
  const result = await query<CustomerRow>(
    `
      SELECT
        id, name, email, phone, address, tax_id, credit_limit, current_balance, created_at, updated_at
      FROM customers
      ORDER BY name ASC
    `
  );

  return result.rows.map(mapCustomer);
}

function buildInvoiceNumber(prefix: string) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const suffix = String(Date.now()).slice(-6);
  return `${prefix}${yyyy}${mm}${dd}-${suffix}`;
}

export async function createSale(input: CreateSaleInput) {
  const settings = await getAppSettings();

  return withTransaction(async (client) => {
    if (!input.items.length) {
      throw new Error('Debes agregar al menos un producto.');
    }

    if (input.discount < 0) {
      throw new Error('El descuento no puede ser negativo.');
    }

    const lockedProducts: Product[] = [];
    for (const item of input.items) {
      const productResult = await client.query<ProductRow>(
        `
          SELECT
            id, name, description, sku, barcode, price, cost, tax_rate, stock, min_stock,
            category, supplier, image_url, is_active, created_at, updated_at
          FROM products
          WHERE id = $1
          FOR UPDATE
        `,
        [item.productId]
      );

      if ((productResult.rowCount ?? 0) === 0) {
        throw new Error(`Producto ${item.productId} no encontrado.`);
      }

      const product = mapProduct(productResult.rows[0]);
      if (!product.isActive) {
        throw new Error(`El producto ${product.name} está inactivo.`);
      }
      if (item.quantity <= 0) {
        throw new Error(`La cantidad para ${product.name} debe ser mayor a cero.`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${product.name}.`);
      }

      lockedProducts.push(product);
    }

    const invoiceItems: InvoiceItem[] = input.items.map((item) => {
      const product = lockedProducts.find((candidate) => candidate.id === item.productId)!;
      const subtotal = product.price * item.quantity;
      const taxAmount = subtotal * (product.taxRate || 0);

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal,
        taxRate: product.taxRate || 0,
        taxAmount,
      };
    });

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = invoiceItems.reduce((sum, item) => sum + item.taxAmount, 0);

    if (input.discount > subtotal) {
      throw new Error('El descuento no puede ser mayor que el subtotal.');
    }

    const total = subtotal + tax - input.discount;
    const invoiceNumber = buildInvoiceNumber(settings.invoice.prefix);

    let customerName = 'Cliente General';
    if (input.customerId !== 'general') {
      const customerResult = await client.query<CustomerRow>(
        `
          SELECT
            id, name, email, phone, address, tax_id, credit_limit, current_balance, created_at, updated_at
          FROM customers
          WHERE id = $1
          FOR UPDATE
        `,
        [input.customerId]
      );

      if ((customerResult.rowCount ?? 0) === 0) {
        throw new Error('Cliente no encontrado.');
      }

      const customer = mapCustomer(customerResult.rows[0]);
      customerName = customer.name;

      if (customer.creditLimit > 0 && customer.currentBalance + total > customer.creditLimit) {
        throw new Error(`El cliente ${customer.name} supera su límite de crédito.`);
      }

      await client.query(
        `
          UPDATE customers
          SET current_balance = current_balance + $2, updated_at = NOW()
          WHERE id = $1
        `,
        [input.customerId, total]
      );
    }

    for (const item of input.items) {
      const product = lockedProducts.find((candidate) => candidate.id === item.productId)!;
      const newStock = product.stock - item.quantity;

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
          VALUES ($1, $2, 'sale', $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          product.id,
          product.name,
          -item.quantity,
          product.stock,
          newStock,
          invoiceNumber,
          'Venta generada desde el Punto de Venta.',
          input.createdBy,
          input.createdByName,
        ]
      );
    }

    const invoiceResult = await client.query<InvoiceRow>(
      `
        INSERT INTO invoices (
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
          created_by_name
        )
        VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, 0, $8, 'pending', 'pos', $9, NOW() + ($10 * INTERVAL '1 day'), $11, $12)
        RETURNING
          id, invoice_number, customer_id, customer_name, items, subtotal, tax, discount, total,
          paid_amount, balance, status, payment_method, notes, due_date, created_by, created_by_name,
          created_at, updated_at
      `,
      [
        invoiceNumber,
        input.customerId,
        customerName,
        JSON.stringify(invoiceItems),
        subtotal,
        tax,
        input.discount,
        total,
        'Venta generada desde el Punto de Venta.',
        settings.invoice.defaultDueDateDays,
        input.createdBy,
        input.createdByName,
      ]
    );

    return mapInvoice(invoiceResult.rows[0]);
  });
}
