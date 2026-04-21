import { memo, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Package, Tag, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DiscountScope } from '../../types';
import type { DiscountFormValues, DiscountVariantItemFormValues } from '../../schemas';
import { VariantPickerDialog } from './VariantPickerDialog';
import { ProductPickerDialog } from './ProductPickerDialog';
import { BrandPickerDialog } from './BrandPickerDialog';

type PickerMode = 'variant' | 'product' | 'brand' | null;

const DiscountAddItemsCardComponent = () => {
  const form = useFormContext<DiscountFormValues>();
  const [openPicker, setOpenPicker] = useState<PickerMode>(null);

  const items = form.watch('items');
  const scope = form.watch('scope');

  const existingVariantIds = useMemo(
    () => items.map((i) => i.productVariantId),
    [items],
  );

  const handleAdd = (added: DiscountVariantItemFormValues[]) => {
    if (added.length === 0) {
      toast.info('Tidak ada varian baru untuk ditambahkan');
      return;
    }
    form.setValue('items', [...items, ...added], {
      shouldDirty: true,
      shouldValidate: true,
    });
    toast.success(`${added.length} varian ditambahkan`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tambah Varian</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={scope === DiscountScope.Variant ? 'default' : 'outline'}
          onClick={() => setOpenPicker('variant')}
        >
          <Palette className="h-4 w-4" />
          Pilih Varian
        </Button>
        <Button
          type="button"
          variant={scope === DiscountScope.Product ? 'default' : 'outline'}
          onClick={() => setOpenPicker('product')}
        >
          <Package className="h-4 w-4" />
          Pilih Produk
        </Button>
        <Button
          type="button"
          variant={scope === DiscountScope.Brand ? 'default' : 'outline'}
          onClick={() => setOpenPicker('brand')}
        >
          <Tag className="h-4 w-4" />
          Pilih Brand
        </Button>

        <VariantPickerDialog
          open={openPicker === 'variant'}
          onOpenChange={(next) => setOpenPicker(next ? 'variant' : null)}
          existingVariantIds={existingVariantIds}
          onAdd={handleAdd}
        />
        <ProductPickerDialog
          open={openPicker === 'product'}
          onOpenChange={(next) => setOpenPicker(next ? 'product' : null)}
          existingVariantIds={existingVariantIds}
          onAdd={handleAdd}
        />
        <BrandPickerDialog
          open={openPicker === 'brand'}
          onOpenChange={(next) => setOpenPicker(next ? 'brand' : null)}
          existingVariantIds={existingVariantIds}
          onAdd={handleAdd}
        />
      </CardContent>
    </Card>
  );
};

export const DiscountAddItemsCard = memo(DiscountAddItemsCardComponent);
