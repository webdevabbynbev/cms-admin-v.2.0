import { memo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { FlashSaleFormValues, FlashSaleVariantFormValues } from '../../schemas';
import { FlashSaleProductPickerDialog } from './FlashSaleProductPickerDialog';

const FlashSaleAddItemsCardComponent = () => {
  const form = useFormContext<FlashSaleFormValues>();
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  const existingVariantIds = (form.watch('variants') ?? []).map((v) => v.variantId);

  const handleAdd = (items: FlashSaleVariantFormValues[]) => {
    if (items.length === 0) {
      toast.info('Semua varian sudah ada di daftar');
      return;
    }
    const current = form.getValues('variants') ?? [];
    form.setValue('variants', [...current, ...items], {
      shouldValidate: true,
      shouldDirty: true,
    });
    toast.success(`${items.length} varian ditambahkan`);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tambah Produk</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setProductDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Pilih Produk
          </Button>
        </CardContent>
      </Card>

      <FlashSaleProductPickerDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        existingVariantIds={existingVariantIds}
        onAdd={handleAdd}
      />
    </>
  );
};

export const FlashSaleAddItemsCard = memo(FlashSaleAddItemsCardComponent);
