import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { DiscountFormValues } from '../../schemas';
import { DiscountScope } from '../../types';

const DiscountFormHeaderComponent = () => {
  const form = useFormContext<DiscountFormValues>();
  const scope = form.watch('scope');
  const isAllProducts = scope === DiscountScope.AllProducts;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informasi Diskon</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Diskon</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Promo Akhir Tahun" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kode Diskon</FormLabel>
              <FormControl>
                <Input
                  placeholder="Otomatis jika kosong"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                Kosongkan untuk generate otomatis dari backend.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isAllProducts ? (
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deskripsi</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Deskripsi opsional"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
      </CardContent>
    </Card>
  );
};

export const DiscountFormHeader = memo(DiscountFormHeaderComponent);
