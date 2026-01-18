'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { AddAdjustmentDialog } from '@/components/inventory/add-adjustment-dialog';
import type { Product, InventoryMovement } from '@/lib/types';
import { InventoryHistoryDialog } from '@/components/inventory/inventory-history-dialog';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import type { adjustmentSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { profile: user } = useUserProfile();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);

  const productsRef = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: productsData, isLoading } = useCollection<Product>(productsRef);

  const products = useMemo(() => {
    if (!productsData) return [];
    return productsData.map(p => ({
        ...p,
        createdAt: (p.createdAt as any)?.toDate ? (p.createdAt as any).toDate() : new Date(),
        updatedAt: (p.updatedAt as any)?.toDate ? (p.updatedAt as any).toDate() : new Date(),
    }));
  }, [productsData]);

  const filteredProducts = useMemo(() => {
    if (isLoading) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm, isLoading]);


  const handleAdjustment = (values: z.infer<typeof adjustmentSchema>) => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "No se puede registrar el ajuste." });
      return;
    }

    const product = products.find(p => p.id === values.productId);
    if (!product) return;

    let newStock = product.stock;
    let quantityChange = values.quantity;

    switch (values.type) {
        case 'purchase':
        case 'return':
            newStock += values.quantity;
            break;
        case 'sale':
        case 'damaged':
        case 'loss':
            newStock -= values.quantity;
            quantityChange = -values.quantity;
            break;
        case 'count':
            quantityChange = values.quantity - product.stock;
            newStock = values.quantity;
            break;
    }

     if (newStock < 0) {
        toast({ variant: 'destructive', title: 'Error de Stock', description: 'El stock no puede ser negativo.' });
        return;
    }

    // 1. Update product stock
    const productRef = doc(firestore, 'products', product.id);
    updateDocumentNonBlocking(productRef, { stock: newStock, updatedAt: serverTimestamp() });
    
    // 2. Create inventory movement record
    const movement: Omit<InventoryMovement, 'id' | 'createdAt'> = {
        productId: product.id,
        productName: product.name,
        type: values.type,
        quantity: quantityChange,
        previousStock: product.stock,
        newStock: newStock,
        reference: `Ajuste manual: ${values.type}`,
        notes: values.notes || '',
        createdBy: user.id,
        createdByName: user.displayName || 'Usuario Anónimo',
    };

    const movementsRef = collection(firestore, 'inventoryMovements');
    addDocumentNonBlocking(movementsRef, { ...movement, createdAt: serverTimestamp() });

    toast({
      title: 'Ajuste de Inventario Exitoso',
      description: `El stock de ${product.name} ha sido actualizado a ${newStock}.`,
    });
    
    setIsAdjustmentDialogOpen(false);
  };


  const handleViewDetails = (productId: string) => {
    router.push(`/products?edit=${productId}`);
  };

  const handleViewHistory = (product: Product) => {
    setSelectedProductForHistory(product);
    setIsHistoryDialogOpen(true);
  };

  const renderTableBody = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
          <TableCell className="text-right hidden md:table-cell"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
        </TableRow>
      ));
    }

    if (filteredProducts.length === 0) {
        return (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No se encontraron productos.
            </TableCell>
          </TableRow>
        );
      }

    return filteredProducts.map((product) => (
        <TableRow key={product.id}>
          <TableCell className="hidden sm:table-cell">
            <Image
              alt={product.name}
              className="aspect-square rounded-md object-cover"
              height="64"
              src={product.imageUrl}
              width="64"
              data-ai-hint="product photo"
              unoptimized
            />
          </TableCell>
          <TableCell className="font-medium">{product.name}</TableCell>
          <TableCell className="text-muted-foreground">{product.sku}</TableCell>
          <TableCell className="text-right font-bold">
              {product.stock <= product.minStock ? (
                  <Badge variant="destructive">{product.stock}</Badge>
              ) : (
                  <Badge variant="outline">{product.stock}</Badge>
              )}
          </TableCell>
          <TableCell className="text-right hidden md:table-cell">{product.minStock}</TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleViewDetails(product.id)}>
                  Ver Detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewHistory(product)}>
                  Ver Historial
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ));
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Inventario</CardTitle>
          <CardDescription>
            Supervisa y ajusta los niveles de stock de tus productos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      type="search"
                      placeholder="Buscar por nombre o SKU..."
                      className="w-full rounded-lg bg-background pl-8 md:w-1/3"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <Button onClick={() => setIsAdjustmentDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nuevo Ajuste
              </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Imagen</span>
                </TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Stock Actual</TableHead>
                <TableHead className="text-right hidden md:table-cell">Stock Mínimo</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableBody()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddAdjustmentDialog
        isOpen={isAdjustmentDialogOpen}
        onClose={() => setIsAdjustmentDialogOpen(false)}
        products={products}
        onAdjust={handleAdjustment}
      />

      {selectedProductForHistory && (
        <InventoryHistoryDialog
          isOpen={isHistoryDialogOpen}
          onClose={() => setIsHistoryDialogOpen(false)}
          product={selectedProductForHistory}
        />
      )}
    </>
  );
}
