import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { VoucherFormValues } from '../../schemas';

const VoucherQuotaCardComponent = () => {
  const form = useFormContext<VoucherFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kuota & Pembatasan</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="qty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kuota Total</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? 0 : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Isi 0 untuk unlimited
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="perUserLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limit per User</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? null : Number(e.target.value),
                      )
                    }
                    placeholder="1"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Maksimal 1 user bisa pakai berapa kali (opsional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <FormLabel className="text-sm">Status Aktif</FormLabel>
                  <FormDescription className="text-xs">
                    Nonaktifkan tanpa menghapus
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isVisible"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <FormLabel className="text-sm">Terlihat Publik</FormLabel>
                  <FormDescription className="text-xs">
                    Tampil di list voucher customer
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isStackable"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <FormLabel className="text-sm">Stack dgn Promo</FormLabel>
                  <FormDescription className="text-xs">
                    Bisa digabung dengan diskon lain
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isVoucherStackable"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <FormLabel className="text-sm">Stack dgn Voucher Lain</FormLabel>
                  <FormDescription className="text-xs">
                    Bisa dipakai bareng voucher lain
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const VoucherQuotaCard = memo(VoucherQuotaCardComponent);
