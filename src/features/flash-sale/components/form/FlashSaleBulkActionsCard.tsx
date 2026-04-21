import { memo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import type { FlashSaleFormValues } from '../../schemas';

interface FlashSaleBulkActionsCardProps {
  selectedIds: number[];
  onClearSelection: () => void;
}

const FlashSaleBulkActionsCardComponent = ({
  selectedIds,
  onClearSelection,
}: FlashSaleBulkActionsCardProps) => {
  const form = useFormContext<FlashSaleFormValues>();
  const [percent, setPercent] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');

  const applyBulk = (scope: 'selected' | 'all') => {
    const values = form.getValues('variants');
    if (!values.length) {
      toast.error('Belum ada produk yang dipilih');
      return;
    }

    const targetIds =
      scope === 'all'
        ? new Set(values.map((v) => v.variantId))
        : new Set(selectedIds);

    if (scope === 'selected' && targetIds.size === 0) {
      toast.error('Pilih minimal 1 baris untuk aksi bulk');
      return;
    }

    const pct = percent !== '' ? Math.max(0, Math.min(100, Number(percent))) : null;
    const pr = price !== '' ? Math.max(0, Number(price)) : null;
    const st = stock !== '' ? Math.max(0, Math.floor(Number(stock))) : null;

    if (pct === null && pr === null && st === null) {
      toast.error('Isi minimal salah satu kolom bulk');
      return;
    }

    const next = values.map((v) => {
      if (!targetIds.has(v.variantId)) return v;
      const updated = { ...v };
      if (pct !== null && v.basePrice > 0) {
        updated.flashPrice = Math.round((v.basePrice * (100 - pct)) / 100);
      }
      if (pr !== null) {
        updated.flashPrice = Math.min(pr, v.basePrice || pr);
      }
      if (st !== null) {
        updated.flashStock = v.baseStock > 0 ? Math.min(st, v.baseStock) : st;
      }
      return updated;
    });

    form.setValue('variants', next, { shouldValidate: true, shouldDirty: true });
    toast.success(
      scope === 'all'
        ? 'Perubahan diterapkan ke semua varian'
        : `Perubahan diterapkan ke ${targetIds.size} varian`,
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aksi Massal</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label className="text-xs">Diskon (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-xs">Harga Flash (Rp)</Label>
            <Input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-xs">Stok Flash</Label>
            <Input
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => applyBulk('selected')}
            disabled={selectedIds.length === 0}
          >
            Terapkan ke Terpilih ({selectedIds.length})
          </Button>
          <Button type="button" variant="outline" onClick={() => applyBulk('all')}>
            Terapkan ke Semua
          </Button>
          {selectedIds.length > 0 ? (
            <Button type="button" variant="ghost" onClick={onClearSelection}>
              Bersihkan Seleksi
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export const FlashSaleBulkActionsCard = memo(FlashSaleBulkActionsCardComponent);
