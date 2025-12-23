import { PlusCircle, Search } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockProducts } from '@/lib/data';

export default function PosPage() {
  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-5">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2 xl:col-span-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar productos por nombre, SKU o código de barras..."
            className="w-full rounded-lg bg-background pl-8"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {mockProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
                <div className="relative">
                    <Image
                        alt={product.name}
                        className="aspect-square w-full object-cover"
                        height="200"
                        src={product.imageUrl}
                        width="200"
                        data-ai-hint="imagen de producto"
                    />
                </div>
              <CardHeader className="p-4">
                <CardTitle className="text-base">{product.name}</CardTitle>
                <CardDescription className="text-xs">{product.sku}</CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-between p-4 pt-0">
                <div className="text-lg font-semibold">${product.price.toFixed(2)}</div>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      <div className="lg:col-span-1 xl:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Carrito</CardTitle>
            <Button variant="outline" size="sm">Limpiar Carrito</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="w-[80px]">Cant</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Arroz Diana 1kg</div>
                    <div className="text-sm text-muted-foreground">
                      $4,500.00
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input type="number" defaultValue="1" className="h-8 w-16" />
                  </TableCell>
                  <TableCell className="text-right">$4,500.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Azúcar Manuelita 1kg</div>
                    <div className="text-sm text-muted-foreground">$3,800.00</div>
                  </TableCell>
                  <TableCell>
                    <Input type="number" defaultValue="2" className="h-8 w-16" />
                  </TableCell>
                  <TableCell className="text-right">$7,600.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="w-full space-y-2">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>$12,100.00</span>
                </div>
                <div className="flex justify-between">
                    <span>Impuesto (19%)</span>
                    <span>$2,299.00</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>$14,399.00</span>
                </div>
            </div>
            <Button className="w-full" size="lg">Procesar Venta</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
