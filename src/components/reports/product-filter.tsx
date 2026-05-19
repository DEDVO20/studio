'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, ShoppingBag, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Product } from '@/lib/types';

interface ProductFilterProps {
  products: Product[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}

export function ProductFilter({
  products,
  selectedIds,
  onChange,
  className,
}: ProductFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      const search = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(search) ||
        (product.sku && product.sku.toLowerCase().includes(search)) ||
        (product.barcode && product.barcode.toLowerCase().includes(search))
      );
    });
  }, [products, searchQuery]);

  const handleToggle = (productId: string) => {
    if (selectedIds.includes(productId)) {
      onChange(selectedIds.filter((id) => id !== productId));
    } else {
      onChange([...selectedIds, productId]);
    }
  };

  const handleSelectAll = () => {
    // Select all currently filtered products or all products
    const idsToSelect = filteredProducts.map((p) => p.id);
    const uniqueIds = Array.from(new Set([...selectedIds, ...idsToSelect]));
    onChange(uniqueIds);
  };

  const handleClearFiltered = () => {
    const filteredIds = filteredProducts.map((p) => p.id);
    onChange(selectedIds.filter((id) => !filteredIds.includes(id)));
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    onChange([]);
    setSearchQuery('');
  };

  const selectedProductsLabel = React.useMemo(() => {
    if (selectedIds.length === 0) return 'Filtrar por productos';
    if (selectedIds.length === 1) {
      const prod = products.find((p) => p.id === selectedIds[0]);
      return prod ? prod.name : '1 producto';
    }
    return `${selectedIds.length} productos`;
  }, [selectedIds, products]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full sm:w-[280px] justify-between text-left font-normal transition-all duration-200 border-dashed hover:border-solid hover:bg-accent/40',
              selectedIds.length > 0 && 'border-primary/50 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary font-medium'
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <ShoppingBag className={cn("h-4 w-4 shrink-0 opacity-70", selectedIds.length > 0 && "text-primary opacity-100 animate-pulse")} />
              <span className="truncate">{selectedProductsLabel}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {selectedIds.length > 0 && (
                <span
                  role="button"
                  tabIndex={0}
                  className="rounded-full hover:bg-primary/20 p-0.5 transition-colors cursor-pointer"
                  onClick={handleClearAll}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleClearAll();
                    }
                  }}
                >
                  <X className="h-3 w-3 text-primary" />
                  <span className="sr-only">Limpiar selección</span>
                </span>
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="end">
          <div className="flex items-center border-b px-3 py-2 gap-2 bg-muted/20">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full border-0 bg-transparent p-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-between border-b px-3 py-1.5 text-xs bg-muted/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-7 px-2 text-primary hover:text-primary hover:bg-primary/5 text-[11px]"
              disabled={filteredProducts.length === 0}
            >
              Seleccionar todos
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFiltered}
              className="h-7 px-2 text-muted-foreground hover:text-foreground text-[11px]"
              disabled={selectedIds.length === 0 || filteredProducts.length === 0}
            >
              Limpiar visibles
            </Button>
          </div>

          <ScrollArea className="h-[250px]">
            <div className="p-1 space-y-0.5">
              {filteredProducts.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No se encontraron productos.
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isChecked = selectedIds.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleToggle(product.id)}
                      className={cn(
                        'flex items-center space-x-3 rounded-md px-3 py-2 cursor-pointer transition-colors hover:bg-accent/50',
                        isChecked && 'bg-primary/5 hover:bg-primary/10'
                      )}
                    >
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={isChecked}
                        onCheckedChange={() => handleToggle(product.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate text-foreground">
                          {product.name}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                            {product.sku || 'Sin SKU'}
                          </span>
                          <span className="text-[11px] font-semibold text-primary/80">
                            ${product.price.toLocaleString('es-CO')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          
          {selectedIds.length > 0 && (
            <div className="border-t p-2 bg-muted/20 flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">
                {selectedIds.length} seleccionados
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClearAll()}
                className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-[11px] font-semibold"
              >
                Limpiar todo
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
