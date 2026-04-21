import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { FlashSaleFormValues } from '../../schemas';

const FlashSaleInfoCardComponent = () => {
  const form = useFormContext<FlashSaleFormValues>();
  const hasButton = form.watch('hasButton');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informasi Flash Sale</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Contoh: Flash Sale Spesial Akhir Pekan"
                  maxLength={255}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Deskripsi singkat flash sale"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hasButton"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">Tampilkan Tombol CTA</FormLabel>
                <FormDescription className="text-xs">
                  Tombol opsional pada banner flash sale
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {hasButton ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="buttonText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teks Tombol</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Contoh: Belanja Sekarang" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="buttonUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Tombol</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="/flash-sale" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export const FlashSaleInfoCard = memo(FlashSaleInfoCardComponent);
