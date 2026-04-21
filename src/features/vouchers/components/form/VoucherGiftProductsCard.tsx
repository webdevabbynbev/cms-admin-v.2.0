import { memo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { VoucherScopeType, VoucherType } from '../../types';
import type { VoucherFormValues } from '../../schemas';
import { VoucherScopePickerDialog } from './VoucherScopePickerDialog';

const VoucherGiftProductsCardComponent = () => {
  const form = useFormContext<VoucherFormValues>();
  const type = form.watch('type');
  const giftProductIds = form.watch('giftProductIds');
  const [pickerOpen, setPickerOpen] = useState(false);

  if (type !== VoucherType.Gift) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Produk Hadiah</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="giftProductIds"
          render={() => (
            <FormItem>
              <FormLabel>Produk yang jadi hadiah</FormLabel>
              <FormDescription className="text-xs">
                Customer akan mendapat produk ini saat voucher digunakan
              </FormDescription>
              <FormControl>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {giftProductIds.length} produk dipilih
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Pilih Produk Hadiah
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <VoucherScopePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          scopeType={VoucherScopeType.Product}
          selectedIds={giftProductIds}
          onChange={(ids) =>
            form.setValue('giftProductIds', ids, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      </CardContent>
    </Card>
  );
};

export const VoucherGiftProductsCard = memo(VoucherGiftProductsCardComponent);
