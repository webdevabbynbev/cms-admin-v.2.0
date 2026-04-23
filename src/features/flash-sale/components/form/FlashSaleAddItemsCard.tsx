import { memo, useState } from 'react';
import { Building2, Package, Plus } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import type { FlashSaleFormValues, FlashSaleVariantFormValues } from '../../schemas';
import { FlashSaleProductPickerDialog } from './FlashSaleProductPickerDialog';
import { FlashSaleVariantPickerDialog } from './FlashSaleVariantPickerDialog';
import { FlashSaleBrandPickerDialog } from './FlashSaleBrandPickerDialog';

type PickerKind = 'product' | 'variant' | 'brand' | null;

const FlashSaleAddItemsCardComponent = () => {
  const form = useFormContext<FlashSaleFormValues>();
  const [picker, setPicker] = useState<PickerKind>(null);

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
            onClick={() => setPicker('product')}
          >
            <Plus className="h-4 w-4" />
            Pilih Produk
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPicker('variant')}
          >
            <Package className="h-4 w-4" />
            Pilih Varian
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPicker('brand')}
          >
            <Building2 className="h-4 w-4" />
            Pilih Brand
          </Button>
        </CardContent>
      </Card>

      <FlashSaleProductPickerDialog
        open={picker === 'product'}
        onOpenChange={(open) => !open && setPicker(null)}
        existingVariantIds={existingVariantIds}
        onAdd={handleAdd}
      />
      <FlashSaleVariantPickerDialog
        open={picker === 'variant'}
        onOpenChange={(open) => !open && setPicker(null)}
        existingVariantIds={existingVariantIds}
        onAdd={handleAdd}
      />
      <FlashSaleBrandPickerDialog
        open={picker === 'brand'}
        onOpenChange={(open) => !open && setPicker(null)}
        existingVariantIds={existingVariantIds}
        onAdd={handleAdd}
      />
    </>
  );
};

export const FlashSaleAddItemsCard = memo(FlashSaleAddItemsCardComponent);
