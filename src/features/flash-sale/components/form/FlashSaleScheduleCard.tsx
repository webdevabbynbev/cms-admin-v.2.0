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
import type { FlashSaleFormValues } from '../../schemas';

const FlashSaleScheduleCardComponent = () => {
  const form = useFormContext<FlashSaleFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Jadwal & Publish</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDatetime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Mulai</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDatetime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Berakhir</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isPublish"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">Publish Flash Sale</FormLabel>
                <FormDescription className="text-xs">
                  Jika dimatikan, flash sale tersimpan sebagai draft
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export const FlashSaleScheduleCard = memo(FlashSaleScheduleCardComponent);
