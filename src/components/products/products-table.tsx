'use client';

import { MoreHorizontal, PlusCircle, File } from 'lucide-react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type { Product } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';

type ProductsTableProps = {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onExport: () => void;
  isLoading: boolean;
};

export function ProductsTable({ products, onAddProduct, onEditProduct, onDeleteProduct, onExport, isLoading }: ProductsTableProps) {
  const { profile } = useUserProfile();
  
  const renderTableRows = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="aspect-square rounded-md h-16 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-3/4" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20" />
          </TableCell>
          <TableCell>
             <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-12" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8" />
          </TableCell>
        </TableRow>
      ));
    }

    if (!products || products.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                    No se encontraron productos.
                </TableCell>
            </TableRow>
        );
    }

    return products.map((product) => {
      if (!product || !product.id) {
        return null;
      }
      
      return (
      <TableRow key={product.id}>
        <TableCell className="hidden sm:table-cell">
          <Image
            alt={product.name}
            className="aspect-square rounded-md object-cover"
            height="64"
            src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`}
            width="64"
            data-ai-hint="product photo"
            unoptimized
          />
        </TableCell>
        <TableCell className="font-medium">{product.name}</TableCell>
        <TableCell>
          <Badge variant={product.isActive ? 'outline' : 'secondary'}>
            {product.isActive ? 'Activo' : 'Archivado'}
          </Badge>
        </TableCell>
        <TableCell>${product.price.toLocaleString('es-CO')}</TableCell>
        <TableCell className="hidden md:table-cell">
          {product.stock}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {product.createdAt instanceof Date ? product.createdAt.toLocaleDateString() : 'Processing...'}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-haspopup="true"
                size="icon"
                variant="ghost"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEditProduct(product)} disabled={profile?.role === 'seller'}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteProduct(product.id)} className="text-destructive" disabled={profile?.role === 'seller'}>
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )});
  }
  
  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="draft">Borrador</TabsTrigger>
          <TabsTrigger value="archived" className="hidden sm:flex">
            Archivados
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={onExport}>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Exportar
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1" onClick={onAddProduct} disabled={profile?.role === 'seller'}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Añadir Producto
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <CardDescription>
              Gestiona tus productos y mira el estado de su inventario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Imagen</span>
                  </TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Stock
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Creado en
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableRows()}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>{isLoading ? '...' : `1-${products?.length || 0}`}</strong> de <strong>{isLoading ? '...' : products?.length || 0}</strong> productos
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
