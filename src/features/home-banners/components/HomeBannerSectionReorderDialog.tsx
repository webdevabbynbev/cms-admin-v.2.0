import { memo, useCallback } from 'react';

import { ReorderDialog } from '@/components/common';
import { homeBannerService } from '../services';
import { useReorderHomeBannerSections } from '../hooks';
import type { HomeBannerSection } from '../types';

interface HomeBannerSectionReorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FETCH_SIZE = 200;

const HomeBannerSectionReorderDialogComponent = ({
  open,
  onOpenChange,
}: HomeBannerSectionReorderDialogProps) => {
  const { mutateAsync: reorder, isPending } = useReorderHomeBannerSections();

  const fetch = useCallback(async () => {
    const res = await homeBannerService.listSections({
      page: 1,
      perPage: FETCH_SIZE,
    });
    const sorted = [...res.data].sort((a, b) => a.order - b.order);
    return { items: sorted, total: res.total };
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
    <ReorderDialog<HomeBannerSection>
      open={open}
      onOpenChange={onOpenChange}
      title="Atur Urutan Section"
      description="Drag section untuk mengubah urutan tampil di homepage."
      fetch={fetch}
      save={save}
      isSaving={isPending}
      contentClassName="sm:max-w-lg"
      emptyMessage="Belum ada section."
      renderItem={(item, index) => (
        <div className="flex items-center gap-3">
          <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">{item.slug}</p>
          </div>
        </div>
      )}
    />
  );
};

export const HomeBannerSectionReorderDialog = memo(
  HomeBannerSectionReorderDialogComponent,
);
export default HomeBannerSectionReorderDialog;
