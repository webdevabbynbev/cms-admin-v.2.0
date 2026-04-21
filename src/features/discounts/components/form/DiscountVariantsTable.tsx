import { memo, useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DISCOUNT_ITEM_VALUE_TYPE_LABELS,
  DiscountItemValueType,
} from '../../types';
import type { DiscountFormValues } from '../../schemas';
import {
  calcDiscountFinalPrice,
  formatDiscountCurrency,
} from '../../utils/formatters';

const DiscountVariantsTableComponent = () => {
  const form = useFormContext<DiscountFormValues>();
  const { fields, remove } = useFieldArray({
    control: form.control,
    name: 'items',
    keyName: '_id',
  });

  const items = form.watch('items');

  const totals = useMemo(() => {
    let totalPromoStock = 0;
    let totalVariants = items.length;
    let activeCount = 0;
    items.forEach((item) => {
      if (item.isActive) activeCount += 1;
      if (item.promoStock != null) totalPromoStock += item.promoStock;
    });
    return { totalVariants, activeCount, totalPromoStock };
  }, [items]);

  if (fields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Varian Terpilih</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Belum ada varian. Gunakan panel di atas untuk menambahkan produk,
          varian, atau brand.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Varian Terpilih ({fields.length})
        </CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{totals.activeCount} aktif</Badge>
          <Badge variant="outline">
            Promo stock: {totals.totalPromoStock.toLocaleString('id-ID')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden p-0">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Produk / SKU</TableHead>
                <TableHead className="min-w-[120px]">Tipe</TableHead>
                <TableHead className="min-w-[120px]">Nilai</TableHead>
                <TableHead className="min-w-[120px]">Max Diskon</TableHead>
                <TableHead className="min-w-[120px]">Harga Akhir</TableHead>
                <TableHead className="min-w-[120px]">Promo Stok</TableHead>
                <TableHead className="min-w-[120px]">Batas Beli</TableHead>
                <TableHead className="w-20">Aktif</TableHead>
                <TableHead className="w-16 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => {
                const item = items[index];
                if (!item) return null;
                const basePrice = item.basePrice ?? 0;
                const finalPrice =
                  basePrice > 0 && item.value != null
                    ? calcDiscountFinalPrice(
                        basePrice,
                        item.valueType,
                        item.value,
                      )
                    : null;
                return (
                  <TableRow key={field._id}>
                    <TableCell>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">
                          {item.productName || '—'}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {item.sku ?? item.variantLabel ?? ''}
                        </span>
                        {basePrice > 0 ? (
                          <span className="text-[10px] text-muted-foreground">
                            Harga: {formatDiscountCurrency(basePrice)}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.valueType}
                        onValueChange={(value) =>
                          form.setValue(
                            `items.${index}.valueType`,
                            value as DiscountItemValueType,
                            { shouldValidate: true, shouldDirty: true },
                          )
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.values(DiscountItemValueType) as DiscountItemValueType[]).map((v) => (
                            <SelectItem key={v} value={v}>
                              {DISCOUNT_ITEM_VALUE_TYPE_LABELS[v]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        className="h-8"
                        value={item.value ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          form.setValue(
                            `items.${index}.value`,
                            v === '' ? null : Number(v),
                            { shouldDirty: true, shouldValidate: true },
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        className="h-8"
                        value={item.maxDiscount ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          form.setValue(
                            `items.${index}.maxDiscount`,
                            v === '' ? null : Number(v),
                            { shouldDirty: true, shouldValidate: true },
                          );
                        }}
                        disabled={item.valueType !== DiscountItemValueType.Percent}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-success">
                      {finalPrice == null ? '—' : formatDiscountCurrency(finalPrice)}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        className="h-8"
                        value={item.promoStock ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          form.setValue(
                            `items.${index}.promoStock`,
                            v === '' ? null : Number(v),
                            { shouldDirty: true, shouldValidate: true },
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        className="h-8"
                        value={item.purchaseLimit ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          form.setValue(
                            `items.${index}.purchaseLimit`,
                            v === '' ? null : Number(v),
                            { shouldDirty: true, shouldValidate: true },
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={(next) =>
                          form.setValue(`items.${index}.isActive`, next, {
                            shouldDirty: true,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(index)}
                        className="text-error hover:bg-error-bg hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export const DiscountVariantsTable = memo(DiscountVariantsTableComponent);
