import 'server-only';

import type { InventoryMovement, Product } from '@/lib/types';
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

type InventoryMovementRow = {
  id: string;
  product_id: string;
  product_name: string;
  type: InventoryMovement['type'];
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference: string;
  notes: string;
  created_by: string;
  created_by_name: string;
  created_at: Date | string;
};

type InventoryAdjustmentInput = {
  productId: string;
  type: InventoryMovement['type'];
  quantity: number;
  notes?: string;
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

function mapMovement(row: InventoryMovementRow): InventoryMovement {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    type: row.type,
    quantity: row.quantity,
    previousStock: row.previous_stock,
    newStock: row.new_stock,
    reference: row.reference,
    notes: row.notes,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: asDate(row.created_at),
  };
}

export async function listInventoryProducts() {
  const result = await query<ProductRow>(
    `
      SELECT
        id, name, description, sku, barcode, price, cost, tax_rate, stock, min_stock,
        category, supplier, image_url, is_active, created_at, updated_at
      FROM products
      ORDER BY name ASC
    `
  );

  return result.rows.map(mapProduct);
}

export async function listInventoryMovements(productId: string) {
  const result = await query<InventoryMovementRow>(
    `
      SELECT
        id, product_id, product_name, type, quantity, previous_stock, new_stock,
        reference, notes, created_by, created_by_name, created_at
      FROM inventory_movements
      WHERE product_id = $1
      ORDER BY created_at DESC
    `,
    [productId]
  );

  return result.rows.map(mapMovement);
}

export async function createInventoryAdjustment(input: InventoryAdjustmentInput) {
  return withTransaction(async (client) => {
    const productResult = await client.query<ProductRow>(
      `
        SELECT
          id, name, description, sku, barcode, price, cost, tax_rate, stock, min_stock,
          category, supplier, image_url, is_active, created_at, updated_at
        FROM products
        WHERE id = $1
        FOR UPDATE
      `,
      [input.productId]
    );

    if ((productResult.rowCount ?? 0) === 0) {
      throw new Error('Producto no encontrado.');
    }

    const product = mapProduct(productResult.rows[0]);
    let newStock = product.stock;
    let quantityChange = input.quantity;

    switch (input.type) {
      case 'purchase':
      case 'return':
        newStock += input.quantity;
        break;
      case 'sale':
      case 'damaged':
      case 'loss':
        newStock -= input.quantity;
        quantityChange = -input.quantity;
        break;
      case 'count':
        quantityChange = input.quantity - product.stock;
        newStock = input.quantity;
        break;
    }

    if (newStock < 0) {
      throw new Error('El stock no puede ser negativo.');
    }

    await client.query(
      `
        UPDATE products
        SET stock = $2, updated_at = NOW()
        WHERE id = $1
      `,
      [product.id, newStock]
    );

    const movementResult = await client.query<InventoryMovementRow>(
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          id, product_id, product_name, type, quantity, previous_stock, new_stock,
          reference, notes, created_by, created_by_name, created_at
      `,
      [
        product.id,
        product.name,
        input.type,
        quantityChange,
        product.stock,
        newStock,
        `Ajuste manual: ${input.type}`,
        input.notes ?? '',
        input.createdBy,
        input.createdByName,
      ]
    );

    return {
      product: {
        ...product,
        stock: newStock,
        updatedAt: new Date(),
      },
      movement: mapMovement(movementResult.rows[0]),
    };
  });
}
