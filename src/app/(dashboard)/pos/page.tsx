'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Search, Trash2, User } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockProducts, mockCustomers, mockInvoices } from '@/lib/data';
import type { Product, Customer, Invoice, InvoiceItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type CartItem = {
  product: Product;
  quantity: number;
};

export default function PosPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [products] = useState<Product[]>(mockProducts);
  const [customers] = useState<Customer[]>(mockCustomers);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] =
    useState<string>('general');

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  
  const tax = cart.reduce(
    (acc, item) => acc + (item.product.price * item.quantity * item.product.taxRate),
    0
  );

  const total = subtotal + tax;

  const handleProcessSale = () => {
    const validCartItems = cart.filter(item => item.quantity > 0);

    if (validCartItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Carrito Vacío',
        description: 'Añade al menos un producto con cantidad válida para procesar la venta.',
      });
      // Actualiza el carrito para reflejar solo los ítems válidos (o vaciarlo)
      setCart(validCartItems);
      return;
    }


    const customer = customers.find((c) => c.id === selectedCustomerId);
    const customerName =
      selectedCustomerId === 'general'
        ? 'Cliente General'
        : customer?.name || 'Cliente General';

    const newInvoiceItems: InvoiceItem[] = validCartItems.map((item) => {
      const itemSubtotal = item.product.price * item.quantity;
      const itemTax = itemSubtotal * item.product.taxRate;
      return {
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        subtotal: itemSubtotal,
        taxRate: item.product.taxRate,
        taxAmount: itemTax,
      }
    });
    
    const finalSubtotal = newInvoiceItems.reduce((acc, item) => acc + item.subtotal, 0);
    const finalTax = newInvoiceItems.reduce((acc, item) => acc + item.taxAmount, 0);
    const finalTotal = finalSubtotal + finalTax;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `FAC-2024-${mockInvoices.length + 1}`,
      customerId: selectedCustomerId,
      customerName: customerName,
      items: newInvoiceItems,
      subtotal: finalSubtotal,
      tax: finalTax,
      discount: 0,
      total: finalTotal,
      paidAmount: 0,
      balance: finalTotal,
      status: 'pending',
      paymentMethod: 'pos', // Indicate it came from POS
      notes: 'Venta generada desde el Punto de Venta.',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days due date
      createdBy: 'user-1',
      createdByName: 'Usuario Administrador',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real app, this would be a server action to save the invoice and update stock
    mockInvoices.unshift(newInvoice);

    toast({
      title: 'Venta Procesada',
      description: `Se ha creado la factura ${newInvoice.invoiceNumber}.`,
    });

    clearCart();
    router.push(`/invoices/${newInvoice.id}`);
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
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
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
                <CardDescription className="text-xs">
                  {product.sku}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-between p-4 pt-0">
                <div className="text-lg font-semibold">
                  ${product.price.toLocaleString('es-CO')}
                </div>
                <Button size="sm" onClick={() => handleAddToCart(product)}>
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
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 flex items-center">
                <User className="mr-2 h-4 w-4" />
                Cliente
              </label>
              <Select
                value={selectedCustomerId}
                onValueChange={setSelectedCustomerId}
              >
                <SelectTrigger>
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
              <p className="text-center text-muted-foreground py-8">
                El carrito está vacío
              </p>
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
                          onChange={(e) =>
                            handleQuantityChange(
                              item.product.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="h-8 w-16"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        $
                        {(item.product.price * item.quantity).toLocaleString(
                          'es-CO'
                        )}
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
                <div className="flex justify-between">
                  <span>Impuesto (Total)</span>
                  <span>${tax.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${total.toLocaleString('es-CO')}</span>
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={handleProcessSale}>
                Procesar Venta
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
