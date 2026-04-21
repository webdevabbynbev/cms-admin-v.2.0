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
import type { VoucherFormValues } from '../../schemas';

const VoucherFormHeaderComponent = () => {
  const form = useFormContext<VoucherFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informasi Voucher</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Voucher</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Voucher Lebaran" {...field} />
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
              <FormLabel>Kode Voucher</FormLabel>
              <FormControl>
                <Input
                  placeholder="LEBARAN25"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormDescription>
                Otomatis uppercase. Customer akan pakai kode ini.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export const VoucherFormHeader = memo(VoucherFormHeaderComponent);
