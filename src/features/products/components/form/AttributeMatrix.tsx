import { useCallback, useMemo, useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Plus, Settings2, Trash2, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { useAttributes } from '../../hooks';
import type {
  AttributeValueOption,
  ProductFormValues,
  VariantFormValues,
} from '../../schemas';
import { defaultVariantFormValues } from '../../schemas';
import { AttributeManagerDialog } from './AttributeManagerDialog';

function cartesianProduct<T>(arrs: T[][]): T[][] {
  if (arrs.length === 0) return [];
  return arrs.reduce<T[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]],
  );
}

export const AttributeMatrix = () => {
  const form = useFormContext<ProductFormValues>();
  const { data: allAttributes = [] } = useAttributes();
  const [managerOpen, setManagerOpen] = useState(false);

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'attributes',
  });

  const attributes = useWatch({ control: form.control, name: 'attributes' });
  const existingVariants = useWatch({ control: form.control, name: 'variants' });

  const takenAttributeIds = useMemo(
    () =>
      new Set(
        (attributes ?? [])
          .map((a) => a.attribute_id)
          .filter((id): id is number => id !== null && id !== undefined),
      ),
    [attributes],
  );

  const toggleValue = useCallback(
    (rowIndex: number, opt: AttributeValueOption) => {
      const row = attributes?.[rowIndex];
      if (!row) return;
      const exists = row.values.some((v) => v.value === opt.value);
      const nextValues = exists
        ? row.values.filter((v) => v.value !== opt.value)
        : [...row.values, opt];
      update(rowIndex, { ...row, values: nextValues });
    },
    [attributes, update],
  );

  const handleAttributeChange = useCallback(
    (rowIndex: number, attrId: number) => {
      const row = attributes?.[rowIndex];
      if (!row) return;
      update(rowIndex, { attribute_id: attrId, values: [] });
    },
    [attributes, update],
  );

  const generateVariants = useCallback(() => {
    const activeRows = (attributes ?? []).filter(
      (a) => a.attribute_id !== null && a.values.length > 0,
    );

    if (activeRows.length === 0) {
      form.setValue('variants', [], { shouldDirty: true });
      return;
    }

    const valueLists = activeRows.map((a) => a.values);
    const combos = cartesianProduct(valueLists);

    const defaults = existingVariants?.[0] ?? defaultVariantFormValues;

    const next: VariantFormValues[] = combos.map((combo) => {
      const combination = combo.map((c) => c.value);
      const display = combo.map((c) => c.label);

      const match = existingVariants?.find(
        (v) =>
          v.combination.length === combination.length &&
          v.combination.every((id, i) => id === combination[i]),
      );

      if (match) {
        return { ...match, combination, display };
      }

      return {
        ...defaultVariantFormValues,
        combination,
        display,
        display_name: display.join(' / '),
        base_price: defaults.base_price,
        price: defaults.price,
        weight: defaults.weight,
      };
    });

    form.setValue('variants', next, { shouldDirty: true, shouldValidate: true });
  }, [attributes, existingVariants, form]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Atribut Variant</Label>
          <p className="text-xs text-muted-foreground">
            Tambah atribut (misal: Ukuran, Warna) lalu pilih nilainya. Klik &quot;Generate&quot; untuk membuat kombinasi variant.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setManagerOpen(true)}
          >
            <Settings2 className="h-4 w-4" /> Kelola
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ attribute_id: null, values: [] })}
          >
            <Plus className="h-4 w-4" /> Tambah Atribut
          </Button>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Belum ada atribut. Klik &quot;Tambah Atribut&quot; untuk mulai.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const row = attributes?.[index];
            const selectedAttrId = row?.attribute_id;
            const selectedAttr = allAttributes.find((a) => a.id === selectedAttrId);
            const availableAttributes = allAttributes.filter(
              (a) => a.id === selectedAttrId || !takenAttributeIds.has(a.id),
            );

            return (
              <div
                key={field.id}
                className="flex flex-col gap-3 rounded-md border border-border p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={selectedAttrId != null ? String(selectedAttrId) : undefined}
                      onValueChange={(v) => handleAttributeChange(index, Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih atribut..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAttributes.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {selectedAttr ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedAttr.values.length === 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Atribut ini belum punya nilai.
                        </span>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto px-0 text-xs"
                          onClick={() => setManagerOpen(true)}
                        >
                          Tambah nilai
                        </Button>
                      </div>
                    ) : (
                      selectedAttr.values.map((v) => {
                        const isSelected = row?.values.some(
                          (sel) => sel.value === v.id,
                        );
                        return (
                          <Badge
                            key={v.id}
                            variant={isSelected ? 'default' : 'outline'}
                            className="cursor-pointer select-none"
                            onClick={() =>
                              toggleValue(index, {
                                label: v.value,
                                value: v.id,
                              })
                            }
                          >
                            {v.value}
                          </Badge>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={generateVariants}
            className="self-start"
          >
            <Wand2 className="h-4 w-4" /> Generate Kombinasi
          </Button>
        </div>
      )}

      <AttributeManagerDialog open={managerOpen} onOpenChange={setManagerOpen} />
    </div>
  );
};
