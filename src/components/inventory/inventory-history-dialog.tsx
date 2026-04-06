'use client';

import { useEffect, useState } from 'react';
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
import type { Product, InventoryMovement } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '../ui/skeleton';

type InventoryHistoryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
};

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
  const [history, setHistory] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadHistory = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/inventory/${product.id}`, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar el historial del producto.');
        }

        const body = (await response.json()) as { movements: InventoryMovement[] };
        setHistory(body.movements);
      } catch (error) {
        console.error('Error loading inventory history from Postgres:', error);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadHistory();
  }, [isOpen, product.id]);


  const renderTableBody = () => {
    if (isLoading) {
        return Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
            </TableRow>
        ));
    }

    if (history.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                    No hay movimientos de inventario para este producto.
                </TableCell>
            </TableRow>
        );
    }

    return history.map((entry) => (
        <TableRow key={entry.id}>
          <TableCell className="text-sm text-muted-foreground">
            {format(entry.createdAt, 'P p', { locale: es })}
          </TableCell>
          <TableCell>
            <Badge variant={adjustmentTypeLabels[entry.type]?.variant || 'secondary'}>
                {adjustmentTypeLabels[entry.type]?.label || entry.type}
            </Badge>
          </TableCell>
          <TableCell className={`font-semibold ${entry.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
          </TableCell>
          <TableCell className="font-medium">{entry.newStock}</TableCell>
          <TableCell className="text-muted-foreground">{entry.createdByName}</TableCell>
          <TableCell className="text-sm text-muted-foreground">{entry.notes}</TableCell>
        </TableRow>
      ));
  };


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
              {renderTableBody()}
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
