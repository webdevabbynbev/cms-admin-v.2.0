import { memo, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { useBrands, useCategoryTypes, usePersonas } from '../../hooks';
import type { CategoryType } from '../../types';
import type { ProductFormValues } from '../../schemas';

const NONE = '__none__';

interface FlatCategory {
  id: number;
  label: string;
}

function flattenCategories(items: CategoryType[], prefix = ''): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const item of items) {
    const label = prefix ? `${prefix} › ${item.name}` : item.name;
    result.push({ id: item.id, label });
    if (item.children && item.children.length > 0) {
      result.push(...flattenCategories(item.children, label));
    }
  }
  return result;
}

const ProductFormCategoryComponent = () => {
  const form = useFormContext<ProductFormValues>();
  const { data: brands = [], isLoading: isLoadingBrands } = useBrands();
  const { data: personas = [], isLoading: isLoadingPersonas } = usePersonas();
  const { data: categoryTypes = [], isLoading: isLoadingCats } = useCategoryTypes();

  const flatCategories = useMemo(() => flattenCategories(categoryTypes), [categoryTypes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Category & Brand</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="brand_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand</FormLabel>
              <Select
                value={field.value == null ? NONE : String(field.value)}
                onValueChange={(v) => field.onChange(v === NONE ? null : Number(v))}
                disabled={isLoadingBrands}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE}>— None —</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="persona_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Persona</FormLabel>
              <Select
                value={field.value == null ? NONE : String(field.value)}
                onValueChange={(v) => field.onChange(v === NONE ? null : Number(v))}
                disabled={isLoadingPersonas}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select persona" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE}>— None —</SelectItem>
                  {personas.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_type_id"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Category</FormLabel>
              <Select
                value={field.value == null ? NONE : String(field.value)}
                onValueChange={(v) => field.onChange(v === NONE ? null : Number(v))}
                disabled={isLoadingCats}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE}>— None —</SelectItem>
                  {flatCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export const ProductFormCategory = memo(ProductFormCategoryComponent);
