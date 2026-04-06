'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
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
import { useEffect } from 'react';
import { usePaymentMethods } from '@/hooks/use-payment-methods';

type AddPaymentDialogProps = {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: z.infer<typeof addPaymentSchema>) => Promise<void>;
};

export function AddPaymentDialog({
  invoice,
  isOpen,
  onClose,
  onSave,
}: AddPaymentDialogProps) {
  const paymentMethods = usePaymentMethods();

  const form = useForm<z.infer<typeof addPaymentSchema>>({
    resolver: zodResolver(
      addPaymentSchema.refine((data) => data.amount <= invoice.balance, {
        message: 'El monto no puede exceder el saldo pendiente.',
        path: ['amount'],
      })
    ),
    defaultValues: {
      amount: invoice.balance > 0 ? invoice.balance : 0,
      paymentMethod: '',
      reference: '',
      notes: '',
    },
  });
  
  const watchedAmount = form.watch('amount');

  useEffect(() => {
    if (isOpen) {
        form.reset({
            amount: invoice.balance > 0 ? invoice.balance : 0,
            paymentMethod: paymentMethods[0] || '',
            reference: '',
            notes: '',
        });
    }
  }, [isOpen, invoice, form, paymentMethods]);

  async function onSubmit(values: z.infer<typeof addPaymentSchema>) {
    await onSave(values);
    onClose();
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
                <div className="font-semibold text-lg text-primary">${(invoice.balance - (watchedAmount || 0)).toLocaleString('es-CO')}</div>
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
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un método de pago" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                              {method}
                          </SelectItem>
                      ))}
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
