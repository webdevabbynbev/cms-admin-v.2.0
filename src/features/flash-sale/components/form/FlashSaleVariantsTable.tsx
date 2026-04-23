import { memo, useMemo, useRef, useState, type DragEvent } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { GripVertical, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

import type { FlashSaleFormValues } from '../../schemas';
import {
  calculateFlashSaleDiscount,
  formatFlashSaleCurrency,
} from '../../utils/formatters';

interface FlashSaleVariantsTableProps {
  selectedIds: number[];
  onSelectedChange: (ids: number[]) => void;
}

const FlashSaleVariantsTableComponent = ({
  selectedIds,
  onSelectedChange,
}: FlashSaleVariantsTableProps) => {
  const form = useFormContext<FlashSaleFormValues>();
  const { fields, remove, update, move } = useFieldArray({
    control: form.control,
    name: 'variants',
    keyName: '_rhfKey',
  });

  const watchedVariants = form.watch('variants');

  const dragFromRef = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = (event: DragEvent<HTMLTableRowElement>, index: number) => {
    dragFromRef.current = index;
    setDragIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    try {
      event.dataTransfer.setData('text/plain', String(index));
    } catch {
      // ignore
    }
  };

  const handleDragOver = (event: DragEvent<HTMLTableRowElement>, index: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setOverIndex(index);
  };

  const handleDrop = (event: DragEvent<HTMLTableRowElement>, dropIndex: number) => {
    event.preventDefault();
    const from = dragFromRef.current;
    dragFromRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
    if (from == null || from === dropIndex) return;
    move(from, dropIndex);
  };

  const handleDragEnd = () => {
    dragFromRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
  };

  const allChecked = useMemo(
    () => fields.length > 0 && selectedIds.length === fields.length,
    [fields.length, selectedIds.length],
  );

  const toggleAll = (checked: boolean) => {
    onSelectedChange(
      checked ? fields.map((f) => (f as unknown as { variantId: number }).variantId) : [],
    );
  };

  const toggleOne = (variantId: number, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...selectedIds, variantId]))
      : selectedIds.filter((id) => id !== variantId);
    onSelectedChange(next);
  };

  if (fields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Produk Terpilih</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada produk dipilih. Gunakan card "Tambah Produk" di atas.
            </p>
            <FormField
              control={form.control}
              name="variants"
              render={() => <FormMessage />}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Produk Terpilih ({fields.length})
        </CardTitle>
        {selectedIds.length > 0 ? (
          <Badge variant="secondary">{selectedIds.length} dipilih</Badge>
        ) : null}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-6" />
                <TableHead className="w-10">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={(c) => toggleAll(Boolean(c))}
                    aria-label="Pilih semua"
                  />
                </TableHead>
                <TableHead>Produk / Varian</TableHead>
                <TableHead>Harga Normal</TableHead>
                <TableHead>Harga Flash</TableHead>
                <TableHead>Diskon</TableHead>
                <TableHead>Stok Flash</TableHead>
                <TableHead>Aktif</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => {
                const variant = (field as unknown) as FlashSaleFormValues['variants'][number];
                const watched = watchedVariants?.[index] ?? variant;
                const discount = calculateFlashSaleDiscount(
                  watched.basePrice,
                  watched.flashPrice,
                );
                const checked = selectedIds.includes(variant.variantId);

                return (
                  <TableRow
                    key={field._rhfKey}
                    draggable
                    onDragStart={(event) => handleDragStart(event, index)}
                    onDragOver={(event) => handleDragOver(event, index)}
                    onDrop={(event) => handleDrop(event, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      !watched.isActive && 'opacity-60',
                      dragIndex === index && 'opacity-40',
                      overIndex === index && dragIndex !== index && 'bg-primary/5',
                    )}
                  >
                    <TableCell className="cursor-grab text-muted-foreground active:cursor-grabbing">
                      <GripVertical className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => toggleOne(variant.variantId, Boolean(c))}
                      />
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {watched.productName || `Produk ${watched.productId}`}
                        </span>
                        {watched.label ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {watched.label}
                          </span>
                        ) : null}
                        {watched.sku ? (
                          <span className="truncate text-xs text-muted-foreground">
                            SKU: {watched.sku}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatFlashSaleCurrency(watched.basePrice)}
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.flashPrice`}
                        render={({ field: inner }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                value={inner.value ?? 0}
                                onChange={(e) =>
                                  inner.onChange(Number(e.target.value) || 0)
                                }
                                className="h-8"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={discount > 0 ? 'default' : 'outline'}>
                        {discount}%
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.flashStock`}
                        render={({ field: inner }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                value={inner.value ?? 0}
                                onChange={(e) =>
                                  inner.onChange(Number(e.target.value) || 0)
                                }
                                className="h-8"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`variants.${index}.isActive`}
                        render={({ field: inner }) => (
                          <Switch
                            checked={inner.value}
                            onCheckedChange={(c) => {
                              inner.onChange(c);
                              update(index, { ...watched, isActive: c });
                            }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-error hover:bg-error-bg hover:text-error"
                        onClick={() => {
                          remove(index);
                          onSelectedChange(
                            selectedIds.filter((id) => id !== variant.variantId),
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export const FlashSaleVariantsTable = memo(FlashSaleVariantsTableComponent);
