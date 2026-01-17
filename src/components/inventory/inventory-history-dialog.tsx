'use client';

import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Product } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type InventoryHistoryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
};

// En una app real, esto vendría de la base de datos
const mockHistory = [
  {
    date: new Date(new Date().setDate(new Date().getDate() - 10)),
    type: 'purchase',
    quantity: 50,
    resultingStock: 100,
    user: 'Usuario Administrador',
    notes: 'Pedido a proveedor La Cosecha',
  },
  {
    date: new Date(new Date().setDate(new Date().getDate() - 8)),
    type: 'sale',
    quantity: -10,
    resultingStock: 90,
    user: 'Punto de Venta',
    notes: 'Factura FAC-2024-0001',
  },
  {
    date: new Date(new Date().setDate(new Date().getDate() - 5)),
    type: 'damaged',
    quantity: -2,
    resultingStock: 88,
    user: 'Usuario Administrador',
    notes: 'Producto dañado en bodega',
  },
  {
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    type: 'sale',
    quantity: -8,
    resultingStock: 80,
    user: 'Punto de Venta',
    notes: 'Factura FAC-2024-0004',
  },
];

const adjustmentTypeLabels: Record<string, { label: string, variant: 'default' | 'destructive' | 'secondary' }> = {
    purchase: { label: 'Compra', variant: 'default' },
    sale: { label: 'Venta', variant: 'secondary' },
    return: { label: 'Devolución', variant: 'default' },
    damaged: { label: 'Dañado', variant: 'destructive' },
    loss: { label: 'Pérdida', variant: 'destructive' },
    count: { label: 'Conteo Físico', variant: 'secondary' },
};


export function InventoryHistoryDialog({
  isOpen,
  onClose,
  product,
}: InventoryHistoryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Historial de Inventario: {product.name}</DialogTitle>
          <DialogDescription>
            Revisa todos los movimientos de stock para este producto. Stock actual: {product.stock}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Stock Resultante</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockHistory.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(entry.date, 'P p', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={adjustmentTypeLabels[entry.type]?.variant || 'secondary'}>
                        {adjustmentTypeLabels[entry.type]?.label || entry.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={`font-semibold ${entry.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.quantity}
                  </TableCell>
                  <TableCell className="font-medium">{entry.resultingStock}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.user}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
