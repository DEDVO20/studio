'use client';

import { useState } from 'react';
import { AlertTriangle, Bot, Loader2, Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { getStockAlert } from '@/app/actions';
import { type StockAlertOutput } from '@/ai/flows/intelligent-stock-alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '../ui/skeleton';

type LowStockCardProps = {
    lowStockProducts: Product[];
    isLoading: boolean;
};

export function LowStockCard({ lowStockProducts, isLoading }: LowStockCardProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [alertResult, setAlertResult] = useState<StockAlertOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAlert = async (product: Product) => {
    setSelectedProduct(product);
    setIsAiLoading(true);
    setError(null);
    setAlertResult(null);

    try {
      const result = await getStockAlert({
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        minStock: product.minStock,
        // In a real app, these would come from your analytics data
        averageDailySales: (product.price > 400) ? 0.5 : 5, 
        leadTimeDays: 14,
        seasonalSalesVariation: 1.2,
        recentSalesTrend: 1.1,
      });
      setAlertResult(result);
    } catch (e) {
      setError('Ocurrió un error al generar el reporte.');
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const closeDialog = () => {
    setSelectedProduct(null);
    setAlertResult(null);
    setError(null);
    setIsAiLoading(false);
  };

  const renderContent = () => {
    if (isLoading) {
        return (
            <ul className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className="flex items-center justify-between gap-4">
                        <div>
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-8 w-28" />
                    </li>
                ))}
            </ul>
        );
    }

    if (lowStockProducts.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-4">
                ¡Buen trabajo! No hay productos con bajo stock.
            </p>
        );
    }

    return (
        <ul className="space-y-3">
            {lowStockProducts.map((product) => (
            <li
                key={product.id}
                className="flex items-center justify-between gap-4"
            >
                <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                    Stock: <span className="font-bold">{product.stock}</span> / Mín: {product.minStock}
                </p>
                </div>
                <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateAlert(product)}
                >
                <Sparkles className="mr-2 h-4 w-4" />
                Alerta IA
                </Button>
            </li>
            ))}
        </ul>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Productos con Poco Stock
          </CardTitle>
          <CardDescription>
            Estos productos necesitan tu atención para ser reabastecidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {renderContent()}
        </CardContent>
      </Card>

      <Dialog open={!!selectedProduct} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Alerta de Stock Inteligente
            </DialogTitle>
            <DialogDescription>
              Predicción con IA para {selectedProduct?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isAiLoading && (
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Analizando datos de ventas y tendencias...
                </p>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {alertResult && (
              <Alert>
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertTitle>Recomendación de Reabastecimiento</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">{alertResult.alertMessage}</p>
                  <p className="font-semibold">
                    Días hasta bajo stock: {alertResult.daysUntilLowStock}
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
