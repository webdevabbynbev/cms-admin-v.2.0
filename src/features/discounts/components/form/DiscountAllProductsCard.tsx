import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { DiscountFormValues } from '../../schemas';

const DiscountAllProductsCardComponent = () => {
  const form = useFormContext<DiscountFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Konfigurasi Semua Produk
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="allProductsPercent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Persentase Diskon (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="1"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === '' ? null : Number(v));
                    }}
                    placeholder="10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Contoh: 10 = diskon 10% untuk semua produk
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allProductsMaxDiscount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maksimal Diskon (Rp)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="1000"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === '' ? null : Number(v));
                    }}
                    placeholder="50000"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Opsional — batas nominal maksimum diskon per transaksi
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const DiscountAllProductsCard = memo(DiscountAllProductsCardComponent);
