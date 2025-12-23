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
import { addPaymentSchema } from '@/lib/schemas';
import type { Invoice } from '@/lib/types';
import { useState } from 'react';

type AddPaymentDialogProps = {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
};

export function AddPaymentDialog({
  invoice,
  isOpen,
  onClose,
}: AddPaymentDialogProps) {
  const { toast } = useToast();
  const [newBalance, setNewBalance] = useState(invoice.balance);

  const form = useForm<z.infer<typeof addPaymentSchema>>({
    resolver: zodResolver(
      addPaymentSchema.refine((data) => data.amount <= invoice.balance, {
        message: 'El monto no puede exceder el saldo pendiente.',
        path: ['amount'],
      })
    ),
    defaultValues: {
      amount: 0,
      paymentMethod: 'cash',
      reference: '',
      notes: '',
    },
  });
  
  const watchedAmount = form.watch('amount');

  function onSubmit(values: z.infer<typeof addPaymentSchema>) {
    // In a real app, you'd call a server action here to process the payment
    console.log(values);
    toast({
      title: 'Pago Agregado',
      description: `Se ha registrado un pago de $${values.amount.toLocaleString('es-CO')}.`,
    });
    onClose();
    form.reset();
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Pago para {invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>
            Añade un pago parcial o total a esta factura.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Saldo Actual</div>
                <div className="font-semibold text-lg">${invoice.balance.toLocaleString('es-CO')}</div>
            </div>
            <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Nuevo Saldo</div>
                <div className="font-semibold text-lg">${(invoice.balance - (watchedAmount || 0)).toLocaleString('es-CO')}</div>
            </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pago</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un método de pago" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. ID de transacción" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Registrar Pago</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
