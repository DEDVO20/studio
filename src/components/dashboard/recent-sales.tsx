import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { mockInvoices } from '@/lib/data';

export function RecentSales() {
  const recentInvoices = mockInvoices.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas Recientes</CardTitle>
        <CardDescription>Realizaste {mockInvoices.length} ventas este mes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentInvoices.map((invoice) => (
          <div key={invoice.id} className="flex items-center gap-4">
            <Avatar className="hidden h-9 w-9 sm:flex">
              <AvatarImage
                src={`https://i.pravatar.cc/150?u=${invoice.customerName}`}
                alt="Avatar"
              />
              <AvatarFallback>{invoice.customerName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <p className="text-sm font-medium leading-none">
                {invoice.customerName}
              </p>
              <p className="text-sm text-muted-foreground">
                Factura #{invoice.invoiceNumber}
              </p>
            </div>
            <div className="ml-auto font-medium">
              +${invoice.total.toLocaleString('es-CO')}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
