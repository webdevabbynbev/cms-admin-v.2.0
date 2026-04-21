import { memo, useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Copy, Plus, Settings2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { EmptyState } from '@/components/common/EmptyState';

import {
  defaultVariantFormValues,
  type ProductFormValues,
  type VariantFormValues,
} from '../../schemas';
import { VariantDetailDialog } from './VariantDetailDialog';

const VariantEditorComponent = () => {
  const form = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });
  const attributes = useWatch({ control: form.control, name: 'attributes' });
  const hasMatrix = (attributes?.length ?? 0) > 0;
  const [detailIndex, setDetailIndex] = useState<number | null>(null);

  const handleAdd = () => {
    const last = fields[fields.length - 1] as unknown as VariantFormValues | undefined;
    const base = form.getValues('base_price');
    const price = form.getValues('price');
    const weight = form.getValues('weight');
    append({
      ...defaultVariantFormValues,
      display_name: '',
      base_price: last?.base_price ?? base ?? 0,
      price: last?.price ?? price ?? 0,
      weight: last?.weight ?? weight ?? 0,
    });
  };

  const handleDuplicate = (index: number) => {
    const source = form.getValues(`variants.${index}`);
    append({
      ...source,
      id: undefined,
      combination: [],
      display: [],
      display_name: `${source.display_name} (copy)`,
      sku: '',
      sku_variant_1: '',
      barcode: '',
    });
  };

  if (fields.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState
          title="Belum ada variant"
          description={
            hasMatrix
              ? 'Pilih atribut & nilai di atas, lalu klik "Generate Kombinasi".'
              : 'Klik "Add variant" untuk menambah variant secara manual, atau tambah atribut di atas untuk auto-generate.'
          }
        />
        {!hasMatrix ? (
          <div className="flex justify-center">
            <Button type="button" onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              Add first variant
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left text-xs font-semibold text-muted-foreground">
                {hasMatrix ? 'Kombinasi' : 'Name'}
              </th>
              <th className="p-3 text-left text-xs font-semibold text-muted-foreground">SKU</th>
              <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Barcode</th>
              <th className="p-3 text-right text-xs font-semibold text-muted-foreground">Base Price</th>
              <th className="p-3 text-right text-xs font-semibold text-muted-foreground">Price</th>
              <th className="p-3 text-right text-xs font-semibold text-muted-foreground">Stock</th>
              <th className="p-3 text-right text-xs font-semibold text-muted-foreground">Weight</th>
              <th className="p-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const variant = form.getValues(`variants.${index}`);
              const hasCombination = (variant?.combination?.length ?? 0) > 0;
              return (
                <tr key={field.id} className="border-t border-border align-top">
                  <td className="min-w-[160px] p-2">
                    <div className="flex items-start gap-2">
                      {variant?.photo_variant ? (
                        <img
                          src={variant.photo_variant}
                          alt="variant"
                          className="h-10 w-10 shrink-0 rounded border border-border object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      {hasCombination ? (
                        <div className="flex flex-wrap gap-1 py-1.5">
                          {(variant.display ?? []).map((label, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <FormField
                          control={form.control}
                          name={`variants.${index}.display_name`}
                          render={({ field: f }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="e.g. Red Small" {...f} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </td>
                  <td className="min-w-[140px] p-2">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.sku_variant_1`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="SKU" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="min-w-[140px] p-2">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.barcode`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Barcode" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="min-w-[120px] p-2">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.base_price`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={1000}
                              className="text-right"
                              value={String(f.value ?? 0)}
                              onChange={(e) => f.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="min-w-[120px] p-2">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.price`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={1000}
                              className="text-right"
                              value={String(f.value ?? 0)}
                              onChange={(e) => f.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="min-w-[100px] p-2">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.stock`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              className="text-right"
                              value={String(f.value ?? 0)}
                              onChange={(e) => f.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="min-w-[100px] p-2">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.weight`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              className="text-right"
                              value={String(f.value ?? 0)}
                              onChange={(e) => f.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Detail"
                        onClick={() => setDetailIndex(index)}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      {!hasMatrix ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          title="Duplicate"
                          onClick={() => handleDuplicate(index)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Delete"
                        onClick={() => remove(index)}
                        className="text-error hover:bg-error-bg hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {form.formState.errors.variants?.root?.message ? (
        <p className="text-sm text-error">
          {form.formState.errors.variants.root.message}
        </p>
      ) : null}

      {!hasMatrix ? (
        <div className="flex justify-end">
          <Button type="button" onClick={handleAdd} variant="outline">
            <Plus className="h-4 w-4" />
            Add variant
          </Button>
        </div>
      ) : null}

      <VariantDetailDialog
        index={detailIndex}
        open={detailIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDetailIndex(null);
        }}
      />
    </div>
  );
};

export const VariantEditor = memo(VariantEditorComponent);
