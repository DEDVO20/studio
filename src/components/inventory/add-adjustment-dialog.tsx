'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { adjustmentSchema } from '@/lib/schemas';
import type { Product } from '@/lib/types';
import { useState } from 'react';
import { mockProducts } from '@/lib/data';

type AddAdjustmentDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAdjust: (productId: string, newStock: number) => void;
};

const adjustmentTypes = {
  purchase: 'Compra (Entrada)',
  sale: 'Venta Manual (Salida)',
  return: 'Devolución (Entrada)',
  damaged: 'Dañado (Salida)',
  loss: 'Pérdida/Robo (Salida)',
  count: 'Conteo Físico (Ajuste)',
};

export function AddAdjustmentDialog({
  isOpen,
  onClose,
  products,
  onAdjust,
}: AddAdjustmentDialogProps) {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const form = useForm<z.infer<typeof adjustmentSchema>>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      quantity: 1,
      notes: '',
    },
  });

  const watchedProductId = form.watch('productId');
  const watchedType = form.watch('type');

  // Update selected product when dropdown changes
  useState(() => {
    if (watchedProductId) {
      setSelectedProduct(products.find((p) => p.id === watchedProductId) || null);
    } else {
      setSelectedProduct(null);
    }
  });


  function onSubmit(values: z.infer<typeof adjustmentSchema>) {
    const product = products.find(p => p.id === values.productId);
    if (!product) return;

    let newStock = product.stock;
    switch (values.type) {
        case 'purchase':
        case 'return':
            newStock += values.quantity;
            break;
        case 'sale':
        case 'damaged':
        case 'loss':
            newStock -= values.quantity;
            if (newStock < 0) {
                form.setError('quantity', { message: 'El stock no puede ser negativo.' });
                return;
            }
            break;
        case 'count':
            newStock = values.quantity;
            break;
    }
    
    // En una app real, llamarías a una server action aquí
    console.log({ ...values, newStock });
    onAdjust(values.productId, newStock);

    toast({
      title: 'Ajuste de Inventario Exitoso',
      description: `El stock de ${product.name} ha sido actualizado a ${newStock}.`,
    });
    
    form.reset({ quantity: 1, notes: '' });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Ajuste de Inventario</DialogTitle>
          <DialogDescription>
            Registra una entrada, salida o corrección de stock para un producto.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedProduct && (
                <div className="text-sm text-muted-foreground">
                    Stock actual: <span className="font-bold">{selectedProduct.stock}</span>
                </div>
            )}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Ajuste</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(adjustmentTypes).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {watchedType === 'count' ? 'Nuevo Stock Total' : 'Cantidad'}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Conteo físico de fin de mes, producto dañado por empaque..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Ajuste</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}