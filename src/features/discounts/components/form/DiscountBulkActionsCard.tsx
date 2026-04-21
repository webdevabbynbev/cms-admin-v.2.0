import { memo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Wand2, Eraser } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  DISCOUNT_ITEM_VALUE_TYPE_LABELS,
  DiscountItemValueType,
} from '../../types';
import type { DiscountFormValues } from '../../schemas';

const DiscountBulkActionsCardComponent = () => {
  const form = useFormContext<DiscountFormValues>();
  const items = form.watch('items');
  const [bulkValueType, setBulkValueType] = useState<DiscountItemValueType>(
    DiscountItemValueType.Percent,
  );
  const [bulkValue, setBulkValue] = useState<string>('');
  const [bulkMax, setBulkMax] = useState<string>('');
  const [bulkStock, setBulkStock] = useState<string>('');
  const [bulkLimit, setBulkLimit] = useState<string>('');

  const applyBulk = () => {
    if (items.length === 0) {
      toast.error('Belum ada varian untuk diterapkan');
      return;
    }
    const valueNum = bulkValue === '' ? null : Number(bulkValue);
    const maxNum = bulkMax === '' ? null : Number(bulkMax);
    const stockNum = bulkStock === '' ? null : Number(bulkStock);
    const limitNum = bulkLimit === '' ? null : Number(bulkLimit);

    items.forEach((_, index) => {
      form.setValue(`items.${index}.valueType`, bulkValueType, {
        shouldDirty: true,
      });
      if (valueNum !== null) {
        form.setValue(`items.${index}.value`, valueNum, { shouldDirty: true });
      }
      if (maxNum !== null) {
        form.setValue(`items.${index}.maxDiscount`, maxNum, {
          shouldDirty: true,
        });
      }
      if (stockNum !== null) {
        form.setValue(`items.${index}.promoStock`, stockNum, {
          shouldDirty: true,
        });
      }
      if (limitNum !== null) {
        form.setValue(`items.${index}.purchaseLimit`, limitNum, {
          shouldDirty: true,
        });
      }
    });
    form.trigger('items');
    toast.success(`Bulk diterapkan ke ${items.length} varian`);
  };

  const clearAll = () => {
    form.setValue('items', [], { shouldDirty: true, shouldValidate: true });
    toast.info('Semua varian dihapus');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bulk Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label className="text-xs">Tipe</Label>
            <Select
              value={bulkValueType}
              onValueChange={(v) => setBulkValueType(v as DiscountItemValueType)}
            >
              <SelectTrigger className="h-9">
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
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nilai</Label>
            <Input
              type="number"
              min={0}
              step="1"
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              placeholder={bulkValueType === DiscountItemValueType.Percent ? '%' : 'Rp'}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max Diskon</Label>
            <Input
              type="number"
              min={0}
              step="1000"
              value={bulkMax}
              onChange={(e) => setBulkMax(e.target.value)}
              placeholder="Rp"
              className="h-9"
              disabled={bulkValueType !== DiscountItemValueType.Percent}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Promo Stok</Label>
            <Input
              type="number"
              min={0}
              step="1"
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Batas Beli</Label>
            <Input
              type="number"
              min={0}
              step="1"
              value={bulkLimit}
              onChange={(e) => setBulkLimit(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={applyBulk} size="sm">
            <Wand2 className="h-4 w-4" />
            Terapkan ke semua
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="text-error"
          >
            <Eraser className="h-4 w-4" />
            Hapus semua varian
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const DiscountBulkActionsCard = memo(DiscountBulkActionsCardComponent);
