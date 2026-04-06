'use client';

import { useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { productSchema } from '@/lib/schemas';
import type { Product } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type ProductFormValues = z.infer<typeof productSchema>;

type ProductFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductFormValues) => Promise<void>;
  product: Product | null;
};

const taxRates = [
    { label: 'Exento (0%)', value: 0 },
    { label: 'Reducido (5%)', value: 0.05 },
    { label: 'General (19%)', value: 0.19 },
];

export function ProductFormDialog({
  isOpen,
  onClose,
  onSave,
  product,
}: ProductFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      cost: 0,
      taxRate: 0.19,
      stock: 0,
      minStock: 0,
      category: '',
      supplier: '',
      description: '',
      imageUrl: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (product) {
        form.reset(product);
      } else {
        form.reset({
          name: '',
          sku: '',
          price: 0,
          cost: 0,
          taxRate: 0.19,
          stock: 0,
          minStock: 10,
          category: '',
          supplier: '',
          description: '',
          imageUrl: '',
          isActive: true,
        });
      }
    }
  }, [isOpen, product, form]);

  const onSubmit = async (values: ProductFormValues) => {
    setIsSaving(true);
    try {
      await onSave(values);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
          <DialogDescription>
            {product
              ? 'Actualiza los detalles del producto.'
              : 'Añade un nuevo producto a tu inventario.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6 pl-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Producto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Arroz Diana 1kg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe brevemente el producto..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la Imagen (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="NEX-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Barras (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="770..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio de Venta</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="4500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo de Compra</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="3200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IVA</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un IVA" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {taxRates.map((rate) => (
                                <SelectItem key={rate.value} value={String(rate.value)}>
                                    {rate.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Actual</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Mínimo</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Granos" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Proveedor (Opcional)</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Distribuidora La Cosecha" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Producto Activo</FormLabel>
                    <DialogDescription>
                      Si está inactivo, no aparecerá en el POS ni en reportes.
                    </DialogDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />


            <DialogFooter className='pt-4'>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Producto'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
