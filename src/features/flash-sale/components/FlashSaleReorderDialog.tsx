import { memo, useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { ReorderDialog } from '@/components/common';
import { flashSaleService } from '../services';
import { useReorderFlashSales } from '../hooks';
import type { FlashSale } from '../types';

interface FlashSaleReorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlashSaleReorderDialogComponent = ({
  open,
  onOpenChange,
}: FlashSaleReorderDialogProps) => {
  const { mutateAsync: reorder, isPending } = useReorderFlashSales();

  const fetch = useCallback(async () => {
    const res = await flashSaleService.list();
    const sorted = [...res].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return { items: sorted };
  }, []);

  const save = useCallback(
    async (updates: Array<{ id: number | string; order: number }>) => {
      await reorder({
        updates: updates.map(({ id, order }) => ({ id: Number(id), order })),
      });
    },
    [reorder],
  );

  return (
    <ReorderDialog<FlashSale>
      open={open}
      onOpenChange={onOpenChange}
      title="Atur Urutan Flash Sale"
      description="Drag untuk mengubah urutan tampil di homepage."
      fetch={fetch}
      save={save}
      isSaving={isPending}
      emptyMessage="Belum ada flash sale."
      renderItem={(item, index) => (
        <div className="flex items-center gap-3">
          <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {item.variants.length} varian
            </p>
          </div>
          <Badge variant={item.isPublish ? 'default' : 'outline'}>
            {item.isPublish ? 'Publish' : 'Draft'}
          </Badge>
        </div>
      )}
    />
  );
};

export const FlashSaleReorderDialog = memo(FlashSaleReorderDialogComponent);
export default FlashSaleReorderDialog;
