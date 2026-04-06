import 'server-only';

import type { Product } from '@/lib/types';
import { query } from '@/lib/postgres';

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

type ProductInput = {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost: number;
  taxRate: number;
  stock: number;
  minStock: number;
  category: string;
  supplier?: string;
  imageUrl?: string;
  isActive: boolean;
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

function normalizeProductInput(input: ProductInput) {
  return {
    name: input.name,
    description: input.description ?? '',
    sku: input.sku ?? '',
    barcode: input.barcode ?? '',
    price: input.price,
    cost: input.cost,
    taxRate: input.taxRate,
    stock: input.stock,
    minStock: input.minStock,
    category: input.category,
    supplier: input.supplier ?? '',
    imageUrl:
      input.imageUrl || `https://picsum.photos/seed/${input.sku || `prod-${Date.now()}`}/400/400`,
    isActive: input.isActive,
  };
}

export async function listProducts() {
  const result = await query<ProductRow>(
    `
      SELECT
        id,
        name,
        description,
        sku,
        barcode,
        price,
        cost,
        tax_rate,
        stock,
        min_stock,
        category,
        supplier,
        image_url,
        is_active,
        created_at,
        updated_at
      FROM products
      ORDER BY created_at DESC
    `
  );

  return result.rows.map(mapProduct);
}

export async function createProduct(input: ProductInput) {
  const normalized = normalizeProductInput(input);

  const result = await query<ProductRow>(
    `
      INSERT INTO products (
        name,
        description,
        sku,
        barcode,
        price,
        cost,
        tax_rate,
        stock,
        min_stock,
        category,
        supplier,
        image_url,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING
        id,
        name,
        description,
        sku,
        barcode,
        price,
        cost,
        tax_rate,
        stock,
        min_stock,
        category,
        supplier,
        image_url,
        is_active,
        created_at,
        updated_at
    `,
    [
      normalized.name,
      normalized.description,
      normalized.sku,
      normalized.barcode,
      normalized.price,
      normalized.cost,
      normalized.taxRate,
      normalized.stock,
      normalized.minStock,
      normalized.category,
      normalized.supplier,
      normalized.imageUrl,
      normalized.isActive,
    ]
  );

  return mapProduct(result.rows[0]);
}

export async function updateProduct(productId: string, input: ProductInput) {
  const normalized = normalizeProductInput(input);

  const result = await query<ProductRow>(
    `
      UPDATE products
      SET
        name = $2,
        description = $3,
        sku = $4,
        barcode = $5,
        price = $6,
        cost = $7,
        tax_rate = $8,
        stock = $9,
        min_stock = $10,
        category = $11,
        supplier = $12,
        image_url = $13,
        is_active = $14,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        name,
        description,
        sku,
        barcode,
        price,
        cost,
        tax_rate,
        stock,
        min_stock,
        category,
        supplier,
        image_url,
        is_active,
        created_at,
        updated_at
    `,
    [
      productId,
      normalized.name,
      normalized.description,
      normalized.sku,
      normalized.barcode,
      normalized.price,
      normalized.cost,
      normalized.taxRate,
      normalized.stock,
      normalized.minStock,
      normalized.category,
      normalized.supplier,
      normalized.imageUrl,
      normalized.isActive,
    ]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return mapProduct(result.rows[0]);
}

export async function deleteProduct(productId: string) {
  await query('DELETE FROM products WHERE id = $1', [productId]);
}
