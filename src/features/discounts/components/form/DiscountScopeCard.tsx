import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DISCOUNT_SCOPE_LABELS, DiscountScope } from '../../types';
import type { DiscountFormValues } from '../../schemas';

const SCOPE_OPTIONS: { value: DiscountScope; label: string; hint: string }[] = [
  {
    value: DiscountScope.Product,
    label: DISCOUNT_SCOPE_LABELS[DiscountScope.Product],
    hint: 'Pilih produk, semua variannya ikut diskon',
  },
  {
    value: DiscountScope.Variant,
    label: DISCOUNT_SCOPE_LABELS[DiscountScope.Variant],
    hint: 'Pilih varian spesifik',
  },
  {
    value: DiscountScope.Brand,
    label: DISCOUNT_SCOPE_LABELS[DiscountScope.Brand],
    hint: 'Pilih brand, seluruh produknya ikut diskon',
  },
  {
    value: DiscountScope.AllProducts,
    label: DISCOUNT_SCOPE_LABELS[DiscountScope.AllProducts],
    hint: 'Terapkan ke semua produk dengan persentase tetap',
  },
];

const DiscountScopeCardComponent = () => {
  const form = useFormContext<DiscountFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cakupan Diskon</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="scope"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="sr-only">Cakupan</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  {SCOPE_OPTIONS.map((option) => {
                    const isSelected = field.value === option.value;
                    return (
                      <label
                        key={option.value}
                        htmlFor={`scope-${option.value}`}
                        className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <RadioGroupItem
                          id={`scope-${option.value}`}
                          value={option.value}
                          className="mt-0.5"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {option.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {option.hint}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export const DiscountScopeCard = memo(DiscountScopeCardComponent);
