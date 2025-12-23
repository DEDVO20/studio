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
import { mockProducts } from '@/lib/data';
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

const lowStockProducts = mockProducts.filter(
  (p) => p.stock <= p.minStock
);

export function LowStockCard() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alertResult, setAlertResult] = useState<StockAlertOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAlert = async (product: Product) => {
    setSelectedProduct(product);
    setIsLoading(true);
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
      setError('An error occurred while generating the report.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const closeDialog = () => {
    setSelectedProduct(null);
    setAlertResult(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Low Stock Products
          </CardTitle>
          <CardDescription>
            These products need your attention for restocking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No products are currently low on stock.
            </p>
          ) : (
            <ul className="space-y-3">
              {lowStockProducts.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: <span className="font-bold">{product.stock}</span> / Min: {product.minStock}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateAlert(product)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Alert
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedProduct} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Intelligent Stock Alert
            </DialogTitle>
            <DialogDescription>
              AI-powered prediction for {selectedProduct?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoading && (
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Analyzing sales data and trends...
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
                <AlertTitle>Restock Recommendation</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">{alertResult.alertMessage}</p>
                  <p className="font-semibold">
                    Days Until Low Stock: {alertResult.daysUntilLowStock}
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
