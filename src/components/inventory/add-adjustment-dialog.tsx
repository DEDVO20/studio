'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { useEffect, useState } from 'react';

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

type AddAdjustmentDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAdjust: (adjustmentData: AdjustmentFormValues) => void;
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      quantity: 1,
      notes: '',
    },
  });

  const watchedProductId = form.watch('productId');
  const watchedType = form.watch('type');

  useEffect(() => {
    if (watchedProductId) {
      setSelectedProduct(products.find((p) => p.id === watchedProductId) || null);
    } else {
      setSelectedProduct(null);
    }
  }, [watchedProductId, products]);

  // Reset form on open/close
  useEffect(() => {
    if (!isOpen) {
        form.reset({
            productId: undefined,
            type: undefined,
            quantity: 1,
            notes: '',
        });
        setSelectedProduct(null);
    }
  }, [isOpen, form]);


  function onSubmit(values: AdjustmentFormValues) {
    onAdjust(values);
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
