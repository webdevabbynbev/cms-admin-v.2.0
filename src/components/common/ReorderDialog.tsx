import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { extractAxiosErrorMessage } from '@/lib/axios-error';
import { LoadingState } from './LoadingState';
import { SortableList, type SortableItem } from './SortableList';

interface ReorderDialogProps<T extends SortableItem> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fetch: () => Promise<{ items: T[]; total?: number }>;
  save: (updates: Array<{ id: number | string; order: number }>) => Promise<void>;
  renderItem: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
  isSaving?: boolean;
  contentClassName?: string;
}

export function ReorderDialog<T extends SortableItem>({
  open,
  onOpenChange,
  title,
  description,
  fetch,
  save,
  renderItem,
  emptyMessage = 'Belum ada data.',
  isSaving = false,
  contentClassName,
}: ReorderDialogProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setDirty(false);
    setTruncated(false);
    fetch()
      .then(({ items: fetched, total }) => {
        if (cancelled) return;
        setItems(fetched);
        if (typeof total === 'number' && total > fetched.length) {
          setTruncated(true);
          toast.warning(
            `Menampilkan ${fetched.length} dari ${total} item. Item di luar batas tidak ikut diurutkan.`,
          );
        }
      })
      .catch(() => toast.error('Gagal memuat data untuk diurutkan'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, fetch]);

  const handleSave = async () => {
    const updates = items.map((item, index) => ({
      id: item.id,
      order: index + 1,
    }));
    try {
      await save(updates);
      toast.success('Urutan berhasil disimpan');
      setDirty(false);
      onOpenChange(false);
    } catch (err) {
      toast.error(extractAxiosErrorMessage(err, 'Gagal menyimpan urutan'));
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (
      !next &&
      dirty &&
      !confirm('Perubahan urutan belum disimpan. Tutup tanpa menyimpan?')
    ) {
      return;
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn('sm:max-w-xl', contentClassName)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <LoadingState />
          ) : items.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <SortableList
              items={items}
              onReorder={(next) => {
                setItems(next);
                setDirty(true);
              }}
              disabled={isSaving}
              renderItem={renderItem}
            />
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={!dirty || isSaving || loading || truncated}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Urutan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
