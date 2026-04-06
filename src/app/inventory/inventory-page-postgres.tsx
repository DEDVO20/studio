'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import Image from 'next/image';
import type { z } from 'zod';

import { AddAdjustmentDialog } from '@/components/inventory/add-adjustment-dialog';
import { InventoryHistoryDialog } from '@/components/inventory/inventory-history-dialog';
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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import type { adjustmentSchema } from '@/lib/schemas';
import type { Product } from '@/lib/types';

export default function InventoryPagePostgres() {
  const router = useRouter();
  const { profile: user } = useUserProfile();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);

  const loadInventory = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/inventory', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('No se pudo cargar el inventario.');
      }

      const body = (await response.json()) as { products: Product[] };
      setProducts(body.products);
    } catch (error) {
      console.error('Error loading inventory from Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo cargar el inventario.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();
  }, []);

  const filteredProducts = useMemo(() => {
    if (isLoading) {
      return [];
    }

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm, isLoading]);

  const handleAdjustment = async (values: z.infer<typeof adjustmentSchema>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se puede registrar el ajuste.',
      });
      return;
    }

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          createdBy: user.id,
          createdByName: user.displayName || 'Usuario Anónimo',
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message || 'No se pudo registrar el ajuste.');
      }

      await loadInventory();

      const product = products.find((entry) => entry.id === values.productId);
      toast({
        title: 'Ajuste de Inventario Exitoso',
        description: `El stock de ${product?.name ?? 'el producto'} ha sido actualizado.`,
      });

      setIsAdjustmentDialogOpen(false);
    } catch (error) {
      console.error('Error creating inventory adjustment in Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo registrar el ajuste.',
      });
    }
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
      return Array.from({ length: 3 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="text-right"><Skeleton className="ml-auto h-6 w-16" /></TableCell>
          <TableCell className="hidden text-right md:table-cell"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="ml-auto h-8 w-8 rounded-full" /></TableCell>
        </TableRow>
      ));
    }

    if (!filteredProducts.length) {
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
        <TableCell className="hidden text-right md:table-cell">{product.minStock}</TableCell>
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
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o SKU..."
                className="w-full rounded-lg bg-background pl-8 md:w-1/3"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
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
                <TableHead className="hidden text-right md:table-cell">Stock Mínimo</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderTableBody()}</TableBody>
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
