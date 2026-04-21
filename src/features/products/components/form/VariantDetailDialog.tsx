import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

import type { ProductFormValues } from '../../schemas';
import { useCategoryFlags } from '../../utils/category-detection';
import { SingleImageUploader } from './SingleImageUploader';

interface VariantDetailDialogProps {
  index: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Comma-separated string input that syncs to string[] in form state.
interface CsvInputProps {
  label: string;
  name:
    | `variants.${number}.main_accords`
    | `variants.${number}.top_notes`
    | `variants.${number}.middle_notes`
    | `variants.${number}.base_notes`;
  placeholder?: string;
  description?: string;
}
const CsvArrayInput = ({ label, name, placeholder, description }: CsvInputProps) => {
  const form = useFormContext<ProductFormValues>();
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const value = Array.isArray(field.value) ? field.value.join(', ') : '';
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                  const arr = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  field.onChange(arr);
                }}
              />
            </FormControl>
            {description ? <FormDescription>{description}</FormDescription> : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export const VariantDetailDialog = ({
  index,
  open,
  onOpenChange,
}: VariantDetailDialogProps) => {
  const form = useFormContext<ProductFormValues>();
  const flags = useCategoryFlags();
  const variant = useMemo(
    () => (index !== null ? form.getValues(`variants.${index}`) : null),
    [form, index, open], // re-read when dialog opens
  );

  if (index === null || !variant) return null;

  const displayLabel =
    variant.display.length > 0
      ? variant.display.join(' / ')
      : variant.display_name || `Variant ${index + 1}`;

  const showMakeup = flags.isMakeup;
  const showPerfume = flags.isPerfume;
  // If no category flags detected, show all fields so user still has access.
  const showAll = !flags.isMakeup && !flags.isPerfume && !flags.isSkincare;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Variant</DialogTitle>
          <DialogDescription>
            Atur atribut tambahan untuk variant ini. Field yang tampil menyesuaikan kategori produk.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">Kombinasi:</span>
            {variant.display.length > 0 ? (
              variant.display.map((d, i) => (
                <Badge key={i} variant="secondary">{d}</Badge>
              ))
            ) : (
              <span className="text-sm">{displayLabel}</span>
            )}
          </div>

          {/* Always-available fields */}
          <FormField
            control={form.control}
            name={`variants.${index}.photo_variant`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Foto Variant</FormLabel>
                <FormControl>
                  <SingleImageUploader
                    value={field.value ?? null}
                    onChange={field.onChange}
                    label="Upload foto variant"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`variants.${index}.bpom`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>BPOM</FormLabel>
                <FormControl>
                  <Input placeholder="Nomor BPOM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Makeup-specific */}
          {(showMakeup || showAll) ? (
            <>
              <Separator />
              <div>
                <Label className="text-sm font-semibold">Makeup Attributes</Label>
                <p className="text-xs text-muted-foreground">
                  Pisahkan beberapa nilai dengan tanda pipe (<code>|</code>), misal:{' '}
                  <code>Fair|Light|Medium</code>.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`variants.${index}.skintone`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skintone</FormLabel>
                      <FormControl>
                        <Input placeholder="Fair|Light|Medium" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.undertone`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Undertone</FormLabel>
                      <FormControl>
                        <Input placeholder="Warm|Cool|Neutral" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.finish`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Finish</FormLabel>
                      <FormControl>
                        <Input placeholder="Matte|Satin|Dewy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.warna`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warna</FormLabel>
                      <FormControl>
                        <Input placeholder="Merah|Coral|Nude" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          ) : null}

          {/* Perfume-specific */}
          {(showPerfume || showAll) ? (
            <>
              <Separator />
              <div>
                <Label className="text-sm font-semibold">Perfume Attributes</Label>
                <p className="text-xs text-muted-foreground">
                  Main accords & notes dipisah dengan koma.
                </p>
              </div>
              <FormField
                control={form.control}
                name={`variants.${index}.perfume_for`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfume For</FormLabel>
                    <FormControl>
                      <Input placeholder="Women / Men / Unisex" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CsvArrayInput
                  label="Main Accords"
                  name={`variants.${index}.main_accords`}
                  placeholder="Floral, Woody, Citrus"
                />
                <CsvArrayInput
                  label="Top Notes"
                  name={`variants.${index}.top_notes`}
                  placeholder="Bergamot, Lemon"
                />
                <CsvArrayInput
                  label="Middle Notes"
                  name={`variants.${index}.middle_notes`}
                  placeholder="Rose, Jasmine"
                />
                <CsvArrayInput
                  label="Base Notes"
                  name={`variants.${index}.base_notes`}
                  placeholder="Sandalwood, Musk"
                />
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
