import { memo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Info } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

import type { ProductFormValues } from '../../schemas';
import { AttributeMatrix } from './AttributeMatrix';
import { VariantEditor } from './VariantEditor';

const ProductFormVariantsComponent = () => {
  const form = useFormContext<ProductFormValues>();
  const hasVariants = useWatch({ control: form.control, name: 'has_variants' });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variant Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="has_variants"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between gap-4 rounded-md border border-border p-4">
                <div className="flex flex-col gap-1">
                  <FormLabel className="text-sm">This product has multiple variants</FormLabel>
                  <FormDescription className="text-xs">
                    Aktifkan jika produk punya ukuran/warna/paket berbeda. Pricing di tab Basic
                    akan diabaikan saat toggle ini aktif.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (!checked) {
                        form.setValue('variants', []);
                        form.setValue('attributes', []);
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {hasVariants ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Variants</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <AttributeMatrix />
            <Separator />
            <VariantEditor />
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Single-variant mode. The product will use the price and stock values from the
            Basic tab.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export const ProductFormVariants = memo(ProductFormVariantsComponent);
