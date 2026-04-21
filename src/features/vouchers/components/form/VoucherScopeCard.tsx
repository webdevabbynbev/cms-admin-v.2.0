import { memo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  VOUCHER_SCOPE_TYPE_LABELS,
  VoucherScopeType,
} from '../../types';
import type { VoucherFormValues } from '../../schemas';
import { VoucherScopePickerDialog } from './VoucherScopePickerDialog';

const VoucherScopeCardComponent = () => {
  const form = useFormContext<VoucherFormValues>();
  const scopeType = form.watch('scopeType');
  const scopeIds = form.watch('scopeIds');
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cakupan Voucher</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="scopeType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Cakupan</FormLabel>
              <FormControl>
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => {
                    const next = Number(v) as VoucherScopeType;
                    field.onChange(next);
                    if (next === VoucherScopeType.All) {
                      form.setValue('scopeIds', [], { shouldDirty: true });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(VOUCHER_SCOPE_TYPE_LABELS) as unknown as VoucherScopeType[]
                    ).map((key) => (
                      <SelectItem key={key} value={String(key)}>
                        {
                          VOUCHER_SCOPE_TYPE_LABELS[
                            Number(key) as VoucherScopeType
                          ]
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {scopeType !== VoucherScopeType.All ? (
          <FormField
            control={form.control}
            name="scopeIds"
            render={() => (
              <FormItem>
                <FormLabel>Item Terpilih</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {scopeIds.length} item dipilih
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPickerOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Pilih Item
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <VoucherScopePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          scopeType={scopeType}
          selectedIds={scopeIds}
          onChange={(ids) =>
            form.setValue('scopeIds', ids, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      </CardContent>
    </Card>
  );
};

export const VoucherScopeCard = memo(VoucherScopeCardComponent);
