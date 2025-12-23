import { File, PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { InvoicesTable } from '@/components/invoices/invoices-table';

export default function InvoicesPage() {
  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="partial">Parciales</TabsTrigger>
          <TabsTrigger value="paid">Pagadas</TabsTrigger>
          <TabsTrigger value="cancelled" className="hidden sm:flex">
            Canceladas
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Exportar
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Añadir Factura
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <InvoicesTable />
      </TabsContent>
      {/* Other TabsContent would go here for filtered views */}
    </Tabs>
  );
}
