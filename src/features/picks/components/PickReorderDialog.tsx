import { memo, useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { ReorderDialog } from '@/components/common';
import { picksService } from '../services';
import { useReorderPicks } from '../hooks';
import type { PickRecord } from '../types';

interface PickReorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: string;
  title: string;
}

const FETCH_SIZE = 200;

const PickReorderDialogComponent = ({
  open,
  onOpenChange,
  endpoint,
  title,
}: PickReorderDialogProps) => {
  const { mutateAsync: reorder, isPending } = useReorderPicks(endpoint);

  const fetch = useCallback(async () => {
    const res = await picksService.list(endpoint, { page: 1, perPage: FETCH_SIZE });
    const sorted = [...res.data].sort((a, b) => a.order - b.order);
    return { items: sorted, total: res.total };
  }, [endpoint]);

  const save = useCallback(
    async (updates: Array<{ id: number | string; order: number }>) => {
      await reorder({
        updates: updates.map(({ id, order }) => ({ id: Number(id), order })),
      });
    },
    [reorder],
  );

  return (
    <ReorderDialog<PickRecord>
      open={open}
      onOpenChange={onOpenChange}
      title={`Atur Urutan — ${title}`}
      description="Drag baris untuk mengubah urutan. Klik Simpan untuk menyimpan ke server."
      fetch={fetch}
      save={save}
      isSaving={isPending}
      contentClassName="sm:max-w-2xl"
      renderItem={(item, index) => (
        <div className="flex items-center gap-3">
          <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">
            {index + 1}
          </span>
          {item.product?.imageUrl ? (
            <img
              src={item.product.imageUrl}
              alt={item.product.name}
              className="h-10 w-10 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded bg-muted" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {item.product?.name ?? `Product #${item.productId}`}
            </p>
            {item.product?.masterSku ? (
              <p className="truncate font-mono text-xs text-muted-foreground">
                {item.product.masterSku}
              </p>
            ) : null}
          </div>
          <Badge variant={item.isActive ? 'default' : 'outline'}>
            {item.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </div>
      )}
    />
  );
};

export const PickReorderDialog = memo(PickReorderDialogComponent);
export default PickReorderDialog;
