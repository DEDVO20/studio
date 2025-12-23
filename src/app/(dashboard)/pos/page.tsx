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
            placeholder="Search products by name, SKU, or barcode..."
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
                        data-ai-hint="product image"
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
                  Add
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      <div className="lg:col-span-1 xl:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Cart</CardTitle>
            <Button variant="outline" size="sm">Clear Cart</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-[80px]">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Quantum-Flux Laptop</div>
                    <div className="text-sm text-muted-foreground">
                      $1,499.99
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input type="number" defaultValue="1" className="h-8 w-16" />
                  </TableCell>
                  <TableCell className="text-right">$1,499.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Ergo-Flow Keyboard</div>
                    <div className="text-sm text-muted-foreground">$179.99</div>
                  </TableCell>
                  <TableCell>
                    <Input type="number" defaultValue="2" className="h-8 w-16" />
                  </TableCell>
                  <TableCell className="text-right">$359.98</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="w-full space-y-2">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>$1,859.97</span>
                </div>
                <div className="flex justify-between">
                    <span>Tax (19%)</span>
                    <span>$353.39</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>$2,213.36</span>
                </div>
            </div>
            <Button className="w-full" size="lg">Process Sale</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
