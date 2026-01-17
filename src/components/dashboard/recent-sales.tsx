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
import type { Invoice } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

type RecentSalesProps = {
    recentInvoices: Invoice[];
    isLoading: boolean;
};

export function RecentSales({ recentInvoices, isLoading }: RecentSalesProps) {

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="grid gap-1 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-5 w-16" />
                    </div>
                ))}
            </div>
        );
    }

    if (recentInvoices.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-4">
                No hay ventas recientes.
            </p>
        );
    }

    return (
        <div className="space-y-4">
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
        </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas Recientes</CardTitle>
        <CardDescription>Las últimas ventas realizadas.</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
