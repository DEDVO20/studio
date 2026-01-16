'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductsTable } from '@/components/products/products-table';
import { ProductFormDialog } from '@/components/products/product-form-dialog';
import { mockProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import type { z } from 'zod';
import type { productSchema } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

export default function ProductsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const editProductId = searchParams.get('edit');
    if (editProductId) {
      const productToEdit = products.find(p => p.id === editProductId);
      if (productToEdit) {
        openDialog(productToEdit);
      }
    }
  }, [searchParams, products]);

  const handleSaveProduct = (
    productData: z.infer<typeof productSchema>
  ) => {
    if (selectedProduct) {
      // Editar
      const productIndex = mockProducts.findIndex(p => p.id === selectedProduct.id);
      if (productIndex !== -1) {
        mockProducts[productIndex] = { ...mockProducts[productIndex], ...productData, updatedAt: new Date() };
      }
      setProducts([...mockProducts]);
      toast({
        title: 'Producto Actualizado',
        description: `El producto ${productData.name} se ha guardado correctamente.`,
      });
    } else {
      // Crear
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        ...productData,
        barcode: productData.barcode || '',
        supplier: productData.supplier || '',
        description: productData.description || '',
        imageUrl: `https://picsum.photos/seed/${productData.sku || `prod-${Date.now()}`}/400/400`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockProducts.unshift(newProduct);
      setProducts([...mockProducts]);
      toast({
        title: 'Producto Creado',
        description: `El producto ${productData.name} se ha añadido al inventario.`,
      });
    }
    closeDialog();
  };
  
  const handleExport = () => {
    const csvHeaders = [
        "ID", "Nombre", "SKU", "Código de Barras", "Descripción", 
        "Precio", "Costo", "Stock", "Stock Mínimo", 
        "Categoría", "Proveedor", "Activo", "Fecha de Creación", "Última Actualización"
    ];
    
    const csvRows = products.map(p => [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        p.barcode,
        `"${p.description.replace(/"/g, '""')}"`,
        p.price,
        p.cost,
        p.stock,
        p.minStock,
        p.category,
        `"${p.supplier.replace(/"/g, '""')}"`,
        p.isActive,
        p.createdAt.toISOString(),
        p.updatedAt.toISOString(),
    ].join(','));

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
        title: "Exportación Completa",
        description: "Los datos de los productos han sido exportados a productos.csv.",
    });
  };


  const openDialog = (product: Product | null = null) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedProduct(null);
    // Remove query param on close
    window.history.replaceState({}, '', '/products');
  };

  return (
    <>
      <ProductsTable
        products={products}
        onAddProduct={() => openDialog()}
        onEditProduct={(product) => openDialog(product)}
        onExport={handleExport}
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
