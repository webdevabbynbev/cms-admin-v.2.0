import { memo, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormDescription,
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
  const [catPickerOpen, setCatPickerOpen] = useState(false);

  const flatCategories = useMemo(() => flattenCategories(categoryTypes), [categoryTypes]);
  const categoryById = useMemo(() => {
    const map = new Map<number, FlatCategory>();
    for (const c of flatCategories) map.set(c.id, c);
    return map;
  }, [flatCategories]);

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
          name="category_type_ids"
          render={({ field }) => {
            const selected = field.value ?? [];
            const toggle = (id: number) => {
              const next = selected.includes(id)
                ? selected.filter((x) => x !== id)
                : [...selected, id];
              field.onChange(next);
              form.setValue('category_type_id', next[0] ?? null, {
                shouldDirty: true,
              });
            };
            const remove = (id: number) => {
              const next = selected.filter((x) => x !== id);
              field.onChange(next);
              form.setValue('category_type_id', next[0] ?? null, {
                shouldDirty: true,
              });
            };

            return (
              <FormItem className="sm:col-span-2">
                <FormLabel>Categories</FormLabel>
                <Popover open={catPickerOpen} onOpenChange={setCatPickerOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        disabled={isLoadingCats}
                        className={cn(
                          'w-full justify-between font-normal',
                          selected.length === 0 && 'text-muted-foreground',
                        )}
                      >
                        {selected.length === 0
                          ? 'Select categories'
                          : `${selected.length} selected`}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search category..." />
                      <CommandList>
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          {flatCategories.map((c) => {
                            const isSelected = selected.includes(c.id);
                            return (
                              <CommandItem
                                key={c.id}
                                value={c.label}
                                onSelect={() => toggle(c.id)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    isSelected ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                {c.label}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selected.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selected.map((id) => {
                      const cat = categoryById.get(id);
                      return (
                        <Badge key={id} variant="secondary" className="gap-1 pr-1">
                          <span className="truncate max-w-[260px]">
                            {cat?.label ?? `#${id}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => remove(id)}
                            className="inline-flex h-4 w-4 items-center justify-center rounded hover:bg-background/70"
                            aria-label={`Remove ${cat?.label ?? id}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                ) : null}

                <FormDescription>
                  The first selected category is used as the primary.
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </CardContent>
    </Card>
  );
};

export const ProductFormCategory = memo(ProductFormCategoryComponent);
