'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle, Search, Trash2, User as UserIcon } from 'lucide-react';
import Image from 'next/image';

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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { Customer, Product } from '@/lib/types';

type CartItem = {
  product: Product;
  quantity: number;
};

export default function PosPagePostgres() {
  const router = useRouter();
  const { toast } = useToast();
  const { profile: user, isLoading: isUserLoading } = useUserProfile();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadBootstrap = async () => {
    setIsLoading(true);

    try {
      const [productResponse, customerResponse] = await Promise.all([
        fetch('/api/products', { method: 'GET', cache: 'no-store' }),
        fetch('/api/customers', { method: 'GET', cache: 'no-store' }),
      ]);

      if (!productResponse.ok) {
        throw new Error('No se pudieron cargar los productos.');
      }

      if (!customerResponse.ok) {
        throw new Error('No se pudieron cargar los clientes.');
      }

      const productBody = (await productResponse.json()) as { products: Product[] };
      const customerBody = (await customerResponse.json()) as { customers: Customer[] };

      setProducts(productBody.products.filter((product) => product.isActive && product.stock > 0));
      setCustomers(customerBody.customers);
    } catch (error) {
      console.error('Error loading POS bootstrap from Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo cargar el POS.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBootstrap();
  }, []);

  const handleAddToCart = (product: Product) => {
    setCart((previous) => {
      const existing = previous.find((item) => item.product.id === product.id);
      if (existing) {
        return previous.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...previous, { product, quantity: 1 }];
    });
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setCart((previous) =>
      previous.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity * (item.product.taxRate || 0),
    0
  );
  const total = subtotal + tax - discount;

  const filteredProducts = useMemo(() => {
    const lowered = searchTerm.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowered) ||
        product.sku.toLowerCase().includes(lowered) ||
        (product.barcode && product.barcode.toLowerCase().includes(lowered))
    );
  }, [products, searchTerm]);

  const handleProcessSale = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Usuario no autenticado',
        description: 'Debes iniciar sesión para poder procesar una venta.',
      });
      return;
    }

    if (isProcessing) {
      return;
    }

    const validCartItems = cart.filter((item) => item.quantity > 0);
    if (!validCartItems.length) {
      toast({
        variant: 'destructive',
        title: 'Carrito Vacío',
        description: 'Añade al menos un producto con cantidad válida para procesar la venta.',
      });
      setCart(validCartItems);
      return;
    }

    if (discount > subtotal) {
      toast({
        variant: 'destructive',
        title: 'Descuento inválido',
        description: 'El descuento no puede ser mayor que el subtotal.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          discount,
          items: validCartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          createdBy: user.id,
          createdByName: user.displayName || 'Vendedor Anónimo',
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message || 'No se pudo procesar la venta.');
      }

      const body = (await response.json()) as { invoice: { id: string; invoiceNumber: string } };

      toast({
        title: 'Venta Procesada',
        description: `Se ha creado la factura ${body.invoice.invoiceNumber}.`,
      });

      clearCart();
      await loadBootstrap();
      router.push(`/invoices/${body.invoice.id}`);
    } catch (error) {
      console.error('Error processing sale in Postgres:', error);
      toast({
        variant: 'destructive',
        title: 'Error en la transacción',
        description:
          error instanceof Error ? error.message : 'No se pudo procesar la venta.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-5">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2 xl:col-span-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar productos por nombre, SKU o código de barras..."
            className="w-full rounded-lg bg-background pl-8"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <CardHeader className="p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </CardHeader>
                <CardFooter className="flex items-center justify-between p-4 pt-0">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-9 w-24" />
                </CardFooter>
              </Card>
            ))
          ) : (
            filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative">
                  <Image
                    alt={product.name}
                    className="aspect-square w-full object-cover"
                    height="200"
                    src={product.imageUrl}
                    width="200"
                    data-ai-hint="imagen de producto"
                    unoptimized
                  />
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-base">{product.name}</CardTitle>
                  <CardDescription className="text-xs">{product.sku}</CardDescription>
                </CardHeader>
                <CardFooter className="flex items-center justify-between p-4 pt-0">
                  <div className="text-lg font-semibold">${product.price.toLocaleString('es-CO')}</div>
                  <Button size="sm" onClick={() => handleAddToCart(product)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
      <div className="lg:col-span-1 xl:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Carrito</CardTitle>
            <Button variant="outline" size="sm" onClick={clearCart} disabled={cart.length === 0}>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 flex items-center text-sm font-medium">
                <UserIcon className="mr-2 h-4 w-4" />
                Cliente
              </label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger disabled={isLoading}>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Cliente General</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {cart.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">El carrito está vacío</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="w-[80px]">Cant</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.product.id}>
                      <TableCell>
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ${item.product.price.toLocaleString('es-CO')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(event) =>
                            handleQuantityChange(
                              item.product.id,
                              parseInt(event.target.value, 10) || 0
                            )
                          }
                          className="h-8 w-16"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        ${(item.product.price * item.quantity).toLocaleString('es-CO')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {cart.length > 0 && (
            <CardFooter className="flex flex-col gap-4">
              <div className="w-full space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <Label htmlFor="discount">Descuento</Label>
                  <div className="flex items-center gap-2">
                    <span>$</span>
                    <Input
                      id="discount"
                      type="number"
                      value={discount}
                      onChange={(event) =>
                        setDiscount(Number(event.target.value) >= 0 ? Number(event.target.value) : 0)
                      }
                      className="h-8 w-28 text-right"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Impuesto (Total)</span>
                  <span>${tax.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${total.toLocaleString('es-CO')}</span>
                </div>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleProcessSale}
                disabled={isProcessing || cart.length === 0 || isUserLoading}
              >
                {isProcessing || isUserLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isProcessing ? 'Procesando...' : isUserLoading ? 'Cargando usuario...' : 'Procesar Venta'}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
