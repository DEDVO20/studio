'use client';

import { useState } from 'react';
import { ProductsTable } from '@/components/products/products-table';
import { ProductFormDialog } from '@/components/products/product-form-dialog';
import { mockProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import type { z } from 'zod';
import type { productSchema } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleSaveProduct = (
    productData: z.infer<typeof productSchema>
  ) => {
    if (selectedProduct) {
      // Editar
      setProducts(
        products.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, ...productData, updatedAt: new Date() }
            : p
        )
      );
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
      setProducts([newProduct, ...products]);
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
