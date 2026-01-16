'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { ProductsTable } from '@/components/products/products-table';
import { ProductFormDialog } from '@/components/products/product-form-dialog';
import type { Product } from '@/lib/types';
import type { z } from 'zod';
import type { productSchema } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

export default function ProductsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const firestore = useFirestore();

  const productsRef = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: products, isLoading } = useCollection<Product>(productsRef);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const productsData: Product[] = useMemo(() => {
    if (!products) return [];
    // The `as any` cast is used here to bypass a TypeScript limitation where it can't infer
    // that we are correctly transforming the Timestamp properties to Date objects.
    return products.map(p => ({
        ...p,
        createdAt: p.createdAt ? (p.createdAt as unknown as Timestamp).toDate() : new Date(),
        updatedAt: p.updatedAt ? (p.updatedAt as unknown as Timestamp).toDate() : new Date(),
    })) as any;
  }, [products]);

  useEffect(() => {
    const editProductId = searchParams.get('edit');
    if (editProductId && productsData.length > 0) {
      const productToEdit = productsData.find(p => p.id === editProductId);
      if (productToEdit) {
        openDialog(productToEdit);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, productsData]);

  const handleSaveProduct = (
    productData: z.infer<typeof productSchema>
  ) => {
    if (selectedProduct) {
      const docRef = doc(firestore, 'products', selectedProduct.id);
      const dataToUpdate = {
        ...productData,
        updatedAt: serverTimestamp(),
      };
      setDocumentNonBlocking(docRef, dataToUpdate, { merge: true });
      toast({
        title: 'Producto Actualizado',
        description: `El producto ${productData.name} se ha guardado correctamente.`,
      });
    } else {
      const collectionRef = collection(firestore, 'products');
      const dataToCreate = {
        ...productData,
        barcode: productData.barcode || '',
        supplier: productData.supplier || '',
        description: productData.description || '',
        imageUrl: productData.imageUrl || `https://picsum.photos/seed/${productData.sku || `prod-${Date.now()}`}/400/400`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      addDocumentNonBlocking(collectionRef, dataToCreate);
      toast({
        title: 'Producto Creado',
        description: `El producto ${productData.name} se ha añadido al inventario.`,
      });
    }
    closeDialog();
  };

  const handleDeleteProduct = (productId: string) => {
    const docRef = doc(firestore, 'products', productId);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: 'Producto Eliminado',
        description: 'El producto ha sido eliminado.',
    });
  }
  
  const handleExport = () => {
    if (!productsData || productsData.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No hay productos para exportar',
      });
      return;
    }
    const csvHeaders = [
        "ID", "Nombre", "SKU", "Código de Barras", "Descripción", 
        "Precio", "Costo", "Stock", "Stock Mínimo", 
        "Categoría", "Proveedor", "Activo", "Fecha de Creación", "Última Actualización"
    ];
    
    const csvRows = productsData.map(p => [
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


  const openDialog = (product: any | null = null) => {
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
