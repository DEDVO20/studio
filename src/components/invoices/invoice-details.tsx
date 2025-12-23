import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Invoice, Customer } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

const statusColors = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700',
    pending: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  };

type InvoiceDetailsProps = {
  invoice: Invoice;
  customer: Customer;
  onAddPayment: () => void;
};

export function InvoiceDetails({ invoice, customer, onAddPayment }: InvoiceDetailsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-2xl">{invoice.invoiceNumber}</CardTitle>
          <CardDescription>
            Fecha: {format(invoice.createdAt, 'PPP')}
          </CardDescription>
        </div>
        <div className="text-right">
            <Badge className={cn('text-base capitalize', statusColors[invoice.status])}>
              {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : invoice.status === 'partial' ? 'Parcial' : 'Cancelada'}
            </Badge>
            <p className="text-sm text-muted-foreground">Vence: {format(invoice.dueDate, 'PPP')}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 md:grid-cols-2">
            <div>
                <h3 className="font-semibold mb-2">Facturado a:</h3>
                <address className="not-italic text-muted-foreground">
                    <strong className="text-foreground">{customer.name}</strong><br />
                    {customer.address}<br />
                    {customer.email}<br />
                    {customer.phone}
                </address>
            </div>
             <div className="text-left md:text-right">
                <h3 className="font-semibold mb-2">De:</h3>
                <address className="not-italic text-muted-foreground">
                    <strong className="text-foreground">NexusStore Inc.</strong><br />
                    123 Innovation Drive, Tech City<br />
                    contact@nexusstore.com<br />
                    (555) 123-4567
                </address>
            </div>
        </div>

        <Separator className="my-6" />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left font-semibold">Producto</th>
                <th className="py-2 text-center font-semibold">Cantidad</th>
                <th className="py-2 text-right font-semibold">Precio Unitario</th>
                <th className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">${item.unitPrice.toLocaleString('es-CO')}</td>
                  <td className="py-2 text-right">${item.subtotal.toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${invoice.subtotal.toLocaleString('es-CO')}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Impuesto Total</span>
                <span>${invoice.tax.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Descuento</span>
                <span>-${invoice.discount.toLocaleString('es-CO')}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
                <span >Total</span>
                <span>${invoice.total.toLocaleString('es-CO')}</span>
            </div>
             <div className="flex justify-between text-green-600">
                <span >Pagado</span>
                <span>-${invoice.paidAmount.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-primary">
                <span >Saldo Pendiente</span>
                <span>${invoice.balance.toLocaleString('es-CO')}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Descargar PDF</Button>
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <Button onClick={onAddPayment}>Registrar un Pago</Button>
        )}
      </CardFooter>
    </Card>
  );
}
