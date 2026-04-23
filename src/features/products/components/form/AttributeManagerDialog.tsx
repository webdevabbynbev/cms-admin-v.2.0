import { memo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { extractAxiosErrorMessage } from '@/lib/axios-error';
import {
  useAttributes,
  useCreateAttribute,
  useCreateAttributeValue,
} from '../../hooks';
import type { Attribute } from '../../types';

interface AttributeManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AttributeRow = ({ attr }: { attr: Attribute }) => {
  const [newValue, setNewValue] = useState('');
  const { mutateAsync: createValue, isPending } = useCreateAttributeValue();

  const handleAdd = async () => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    try {
      await createValue({ attributeId: attr.id, value: trimmed });
      setNewValue('');
      toast.success(`Nilai "${trimmed}" ditambahkan`);
    } catch (err) {
      toast.error(extractAxiosErrorMessage(err, 'Gagal menambah nilai'));
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{attr.name}</span>
        <span className="text-xs text-muted-foreground">
          {attr.values.length} nilai
        </span>
      </div>
      {attr.values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {attr.values.map((v) => (
            <Badge key={v.id} variant="secondary">
              {v.value}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Belum ada nilai.</p>
      )}
      <div className="flex items-center gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleAdd();
            }
          }}
          placeholder="Tambah nilai baru..."
          className="h-8"
          disabled={isPending}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void handleAdd()}
          disabled={!newValue.trim() || isPending}
        >
          <Plus className="h-3 w-3" />
          Tambah
        </Button>
      </div>
    </div>
  );
};

const AttributeManagerDialogComponent = ({
  open,
  onOpenChange,
}: AttributeManagerDialogProps) => {
  const { data: attributes = [], isLoading } = useAttributes();
  const { mutateAsync: createAttribute, isPending: isCreating } = useCreateAttribute();
  const [newAttrName, setNewAttrName] = useState('');

  const handleCreateAttribute = async () => {
    const trimmed = newAttrName.trim();
    if (!trimmed) return;
    try {
      await createAttribute(trimmed);
      setNewAttrName('');
      toast.success(`Atribut "${trimmed}" dibuat`);
    } catch (err) {
      toast.error(extractAxiosErrorMessage(err, 'Gagal membuat atribut'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Kelola Atribut</DialogTitle>
          <DialogDescription>
            Buat atribut baru (mis. Ukuran, Warna) dan tambah nilainya. Perubahan
            langsung tersedia di selector atribut.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Input
              value={newAttrName}
              onChange={(e) => setNewAttrName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleCreateAttribute();
                }
              }}
              placeholder="Nama atribut baru..."
              disabled={isCreating}
            />
            <Button
              type="button"
              onClick={() => void handleCreateAttribute()}
              disabled={!newAttrName.trim() || isCreating}
            >
              <Plus className="h-4 w-4" />
              Buat Atribut
            </Button>
          </div>

          <Separator />

          <div className="max-h-[50vh] overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : attributes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada atribut. Buat yang pertama di atas.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {attributes.map((attr) => (
                  <AttributeRow key={attr.id} attr={attr} />
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const AttributeManagerDialog = memo(AttributeManagerDialogComponent);
export default AttributeManagerDialog;
