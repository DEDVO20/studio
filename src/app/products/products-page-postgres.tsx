'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { z } from 'zod';

import { ProductFormDialog } from '@/components/products/product-form-dialog';
import { ProductsTable } from '@/components/products/products-table';
import { useToast } from '@/hooks/use-toast';
import type { productSchema } from '@/lib/schemas';
import type { Product } from '@/lib/types';

export default function ProductsPagePostgres() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const normalizeProduct = (product: Product) => ({
    ...product,
    createdAt:
      product.createdAt instanceof Date ? product.createdAt : new Date(product.createdAt),
    updatedAt:
      product.updatedAt instanceof Date ? product.updatedAt : new Date(product.updatedAt),
  });

  const loadProducts = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/products', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('No se pudieron cargar los productos.');
      }

      const body = (await response.json()) as { products: Product[] };
      setProducts(body.products.map(normalizeProduct));
    } catch (error) {
      console.error('Error loading products from Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los productos desde Postgres.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const productsData = useMemo(() => products ?? [], [products]);

  useEffect(() => {
    const editProductId = searchParams.get('edit');
    if (editProductId && productsData.length > 0) {
      const productToEdit = productsData.find((product) => product.id === editProductId);
      if (productToEdit) {
        openDialog(productToEdit);
      }
    }
  }, [searchParams, productsData]);

  const handleSaveProduct = async (productData: z.infer<typeof productSchema>) => {
    try {
      const response = await fetch(
        selectedProduct ? `/api/products/${selectedProduct.id}` : '/api/products',
        {
          method: selectedProduct ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        }
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message || 'No se pudo guardar el producto.');
      }

      await loadProducts();

      toast({
        title: selectedProduct ? 'Producto Actualizado' : 'Producto Creado',
        description: selectedProduct
          ? `El producto ${productData.name} se ha guardado correctamente.`
          : `El producto ${productData.name} se ha añadido al inventario.`,
      });

      closeDialog();
    } catch (error) {
      console.error('Error saving product in Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo guardar el producto.',
      });
      throw error;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el producto.');
      }

      await loadProducts();

      toast({
        title: 'Producto Eliminado',
        description: 'El producto ha sido eliminado.',
      });
    } catch (error) {
      console.error('Error deleting product in Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo eliminar el producto.',
      });
    }
  };

  const handleExport = () => {
    if (!productsData.length) {
      toast({
        variant: 'destructive',
        title: 'No hay productos para exportar',
      });
      return;
    }

    const csvHeaders = [
      'ID',
      'Nombre',
      'SKU',
      'Código de Barras',
      'Descripción',
      'Precio',
      'Costo',
      'Stock',
      'Stock Mínimo',
      'Categoría',
      'Proveedor',
      'Activo',
      'Fecha de Creación',
      'Última Actualización',
    ];

    const csvRows = productsData.map((product) =>
      [
        product.id,
        `"${product.name.replace(/"/g, '""')}"`,
        product.sku,
        product.barcode,
        `"${(product.description || '').replace(/"/g, '""')}"`,
        product.price,
        product.cost,
        product.stock,
        product.minStock,
        product.category,
        `"${(product.supplier || '').replace(/"/g, '""')}"`,
        product.isActive,
        product.createdAt.toISOString(),
        product.updatedAt.toISOString(),
      ].join(',')
    );

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'productos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Exportación Completa',
      description: 'Los datos de los productos han sido exportados a productos.csv.',
    });
  };

  const openDialog = (product: Product | null = null) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedProduct(null);
    window.history.replaceState({}, '', '/products');
  };

  return (
    <>
      <ProductsTable
        products={productsData}
        onAddProduct={() => openDialog()}
        onEditProduct={(product) => openDialog(product)}
        onDeleteProduct={handleDeleteProduct}
        onExport={handleExport}
        isLoading={isLoading}
      />
      <ProductFormDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onSave={handleSaveProduct}
        product={selectedProduct}
      />
    </>
  );
}
