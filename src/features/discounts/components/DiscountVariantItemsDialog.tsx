import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DiscountItemValueType } from '../types';
import type { DiscountListItem } from '../types';
import {
  calcDiscountFinalPrice,
  formatDiscountCurrency,
  formatDiscountPercent,
} from '../utils/formatters';

interface DiscountVariantItemsDialogProps {
  discount: DiscountListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DiscountVariantItemsDialogComponent = ({
  discount,
  open,
  onOpenChange,
}: DiscountVariantItemsDialogProps) => {
  if (!discount) return null;
  const items = discount.variantItems ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Varian dalam diskon</DialogTitle>
          <DialogDescription>
            {discount.name} ({discount.code}) — {items.length} varian
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk / SKU</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Nilai</TableHead>
                <TableHead className="text-right">Harga Akhir</TableHead>
                <TableHead className="text-right">Stok Promo</TableHead>
                <TableHead className="text-right">Batas Beli</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Tidak ada varian
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => {
                  const basePrice = item.variant?.price ?? 0;
                  const finalPrice =
                    basePrice > 0 && item.value != null
                      ? calcDiscountFinalPrice(
                          basePrice,
                          item.valueType,
                          item.value,
                        )
                      : null;
                  return (
                    <TableRow key={item.id ?? `${item.productVariantId}-${index}`}>
                      <TableCell>
                        <div className="flex min-w-0 flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {item.variant?.product?.name ?? '—'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.variant?.sku ?? item.variant?.label ?? '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {item.valueType === DiscountItemValueType.Percent
                            ? 'Persen'
                            : 'Nominal'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {item.value == null
                          ? '—'
                          : item.valueType === DiscountItemValueType.Percent
                            ? formatDiscountPercent(item.value)
                            : formatDiscountCurrency(item.value)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {finalPrice == null
                          ? '—'
                          : formatDiscountCurrency(finalPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {item.promoStock ?? '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {item.purchaseLimit ?? '—'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const DiscountVariantItemsDialog = memo(DiscountVariantItemsDialogComponent);
