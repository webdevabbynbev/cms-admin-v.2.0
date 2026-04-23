import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import { axiosClient } from '@/config/axios';
import type { ServeWrapper } from '@/lib/api-types';
import { cn } from '@/lib/utils';
import { defaultSaleFormValues, saleFormSchema, type SaleFormValues } from '../schemas';
import { useCreateSale, useSaleDetail, useUpdateSale } from '../hooks';
import { formatIDR } from '@/features/reports/utils/formatters';
import type { SaleVariant } from '../types';

// ── date helpers ──────────────────────────────────────────────────────────────
function toApiDatetime(html: string): string {
  return html ? html.replace('T', ' ') + ':00' : '';
}
function toHtmlDatetime(api: string): string {
  if (!api) return '';
  return api.replace(' ', 'T').slice(0, 16);
}

// ── product search ────────────────────────────────────────────────────────────
interface ProductOption {
  id: number;
  name: string;
  masterSku: string | null;
}
interface RawVariant {
  id: number;
  sku: string | null;
  price: number;
  stock: number;
  label: string | null;
  variantLabel: string | null;
  attributes: { attribute?: { name: string }; value: string }[];
  medias?: { type: number; url: string }[];
  product?: { name: string; medias?: { type: number; url: string }[] };
}

function useProductSearch(q: string) {
  return useQuery({
    queryKey: ['sale-product-search', q],
    queryFn: async (): Promise<ProductOption[]> => {
      const params = new URLSearchParams({ name: q, page: '1', per_page: '30' });
      const res = await axiosClient.get<ServeWrapper<{ data: unknown[] }>>(
        `/admin/product?${params.toString()}`,
      );
      return (res.data.serve?.data ?? []).map((r) => {
        const raw = r as Record<string, unknown>;
        return {
          id: Number(raw.id),
          name: String(raw.name ?? ''),
          masterSku: ((raw.masterSku ?? raw.master_sku) as string | null) ?? null,
        };
      });
    },
    enabled: q.length >= 1,
    staleTime: 30_000,
  });
}

function useProductVariants(productId: number | null) {
  return useQuery({
    queryKey: ['sale-product-variants', productId],
    queryFn: async (): Promise<RawVariant[]> => {
      const res = await axiosClient.get<ServeWrapper<unknown>>(
        `/admin/product/${productId}`,
      );
      const p = res.data.serve as Record<string, unknown>;
      return Array.isArray(p.variants) ? p.variants as RawVariant[] : [];
    },
    enabled: productId !== null,
    staleTime: 60_000,
  });
}

function buildVariantLabel(v: RawVariant): string {
  if (v.variantLabel) return v.variantLabel;
  if (v.label) return v.label;
  if (v.attributes?.length) {
    return v.attributes
      .map((a) => `${a.attribute?.name ?? ''}: ${a.value}`)
      .join(', ');
  }
  return v.sku ?? String(v.id);
}

function getFirstImage(medias?: { type: number; url: string }[]): string | null {
  if (!medias?.length) return null;
  return medias.find((m) => m.type === 1)?.url ?? medias[0]?.url ?? null;
}

// ── editable variant row ───────────────────────────────────────────────────────
interface VariantRowProps {
  item: SaleVariant;
  onChange: (updated: SaleVariant) => void;
  onRemove: () => void;
}
function VariantRow({ item, onChange, onRemove }: VariantRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border p-2">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.productName} className="h-10 w-10 shrink-0 rounded object-cover" />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded bg-muted" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.productName}</p>
        <p className="truncate text-xs text-muted-foreground">{item.variantLabel}</p>
        <p className="text-xs text-muted-foreground">Harga awal: {formatIDR(item.basePrice)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Harga Sale</Label>
          <Input
            type="number"
            min={0}
            value={item.salePrice}
            onChange={(e) => onChange({ ...item, salePrice: Number(e.target.value) })}
            className="w-28"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Stok Sale</Label>
          <Input
            type="number"
            min={1}
            value={item.saleStock}
            onChange={(e) => onChange({ ...item, saleStock: Number(e.target.value) })}
            className="w-24"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          className="mt-4 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── main form ─────────────────────────────────────────────────────────────────
const SaleFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');
  const editId = isEdit ? id! : null;

  const { data: existing } = useSaleDetail(editId);
  const { mutateAsync: createSale } = useCreateSale();
  const { mutateAsync: updateSale } = useUpdateSale();

  // product picker state
  const [productSearch, setProductSearch] = useState('');
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);

  // added variants (managed separately from form)
  const [variantItems, setVariantItems] = useState<SaleVariant[]>([]);

  const { data: productOptions = [] } = useProductSearch(productSearch);
  const { data: rawVariants = [], isLoading: isLoadingVariants } = useProductVariants(
    selectedProduct?.id ?? null,
  );

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema) as Resolver<SaleFormValues>,
    defaultValues: defaultSaleFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        title: existing.title ?? '',
        description: existing.description ?? '',
        startDatetime: toHtmlDatetime(existing.startDatetime),
        endDatetime: toHtmlDatetime(existing.endDatetime),
        isPublish: existing.isPublish,
        hasButton: existing.hasButton,
        buttonText: existing.buttonText ?? '',
        buttonUrl: existing.buttonUrl ?? '',
      });
      setVariantItems(existing.variants ?? []);
    }
  }, [existing, isEdit, form]);

  const addVariant = (v: RawVariant, productName: string, productImg: string | null) => {
    if (variantItems.some((i) => i.variantId === v.id)) {
      toast.warning('Varian ini sudah ditambahkan');
      return;
    }
    const imageUrl = getFirstImage(v.medias) ?? productImg;
    setVariantItems((prev) => [
      ...prev,
      {
        variantId: v.id,
        productId: selectedProduct?.id ?? 0,
        productName,
        variantLabel: buildVariantLabel(v),
        sku: v.sku,
        imageUrl,
        basePrice: v.price,
        baseStock: v.stock,
        salePrice: v.price,
        saleStock: v.stock,
      },
    ]);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (variantItems.length === 0) {
      toast.error('Tambahkan minimal 1 produk/varian');
      return;
    }
    try {
      const payload = {
        title: values.title.trim() || null,
        description: values.description?.trim() || null,
        start_datetime: toApiDatetime(values.startDatetime),
        end_datetime: toApiDatetime(values.endDatetime),
        is_publish: values.isPublish,
        has_button: values.hasButton,
        button_text: values.hasButton ? (values.buttonText?.trim() || null) : null,
        button_url: values.hasButton ? (values.buttonUrl?.trim() || null) : null,
        variants: variantItems.map((v) => ({
          variant_id: v.variantId,
          sale_price: v.salePrice,
          stock: v.saleStock,
        })),
      };
      if (isEdit && editId) {
        await updateSale({ id: editId, payload });
        toast.success('Sale berhasil diupdate');
        navigate('/sales-new');
      } else {
        const created = await createSale(payload);
        toast.success('Sale berhasil dibuat');
        navigate(`/sales-new/${created.id}`);
      }
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan sale');
      toast.error(msg);
    }
  });

  const hasButton = form.watch('hasButton');

  // product image (from first variant or product medias)
  const productImg =
    rawVariants.length > 0 ? getFirstImage(rawVariants[0]?.product?.medias) : null;

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title={isEdit ? 'Edit Sale' : 'Buat Sale Baru'}
          description="Promo sale dengan harga khusus per varian."
          actions={
            <Button variant="ghost" onClick={() => navigate('/sales-new')}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          }
        />

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          {/* Info dasar */}
          <div className="rounded-lg border border-border p-4">
            <p className="mb-3 text-sm font-semibold">Info Sale</p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sale-title">Judul</Label>
                <Input id="sale-title" {...form.register('title')} />
                {form.formState.errors.title ? (
                  <span className="text-xs text-destructive">
                    {form.formState.errors.title.message}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sale-desc">Deskripsi</Label>
                <Textarea id="sale-desc" {...form.register('description')} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sale-start">Mulai</Label>
                  <Input
                    id="sale-start"
                    type="datetime-local"
                    {...form.register('startDatetime')}
                  />
                  {form.formState.errors.startDatetime ? (
                    <span className="text-xs text-destructive">
                      {form.formState.errors.startDatetime.message}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sale-end">Selesai</Label>
                  <Input
                    id="sale-end"
                    type="datetime-local"
                    {...form.register('endDatetime')}
                  />
                  {form.formState.errors.endDatetime ? (
                    <span className="text-xs text-destructive">
                      {form.formState.errors.endDatetime.message}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label className="text-sm">Publish</Label>
                <Switch
                  checked={form.watch('isPublish')}
                  onCheckedChange={(v) => form.setValue('isPublish', v)}
                />
              </div>
            </div>
          </div>

          {/* Button opsional */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Tombol CTA (opsional)</p>
              <Switch
                checked={hasButton}
                onCheckedChange={(v) => form.setValue('hasButton', v)}
              />
            </div>
            {hasButton ? (
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sale-btn-text">Teks Tombol</Label>
                  <Input id="sale-btn-text" {...form.register('buttonText')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sale-btn-url">URL Tombol</Label>
                  <Input id="sale-btn-url" {...form.register('buttonUrl')} />
                </div>
              </div>
            ) : null}
          </div>

          {/* Produk & Varian */}
          <div className="rounded-lg border border-border p-4">
            <p className="mb-3 text-sm font-semibold">Produk Sale ({variantItems.length} varian)</p>

            {/* Product search */}
            <div className="mb-3">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Cari & tambah produk</Label>
              <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between sm:w-80">
                    <span className="truncate text-sm text-muted-foreground">
                      {selectedProduct ? selectedProduct.name : 'Pilih produk...'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Ketik nama produk..."
                      value={productSearch}
                      onValueChange={setProductSearch}
                    />
                    <CommandList>
                      {productOptions.length === 0 ? (
                        <CommandEmpty>
                          {productSearch.length >= 1 ? 'Tidak ditemukan.' : 'Ketik untuk mencari.'}
                        </CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {productOptions.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={String(p.id)}
                              onSelect={() => {
                                setSelectedProduct(p);
                                setProductPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedProduct?.id === p.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm">{p.name}</p>
                                {p.masterSku ? (
                                  <p className="font-mono text-xs text-muted-foreground">{p.masterSku}</p>
                                ) : null}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Variants of selected product */}
            {selectedProduct && (
              <div className="mb-4 rounded-md border border-dashed border-border p-3">
                <p className="mb-2 text-xs font-medium">
                  Varian: <span className="text-foreground">{selectedProduct.name}</span>
                </p>
                {isLoadingVariants ? (
                  <p className="text-xs text-muted-foreground">Memuat varian...</p>
                ) : rawVariants.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Tidak ada varian.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {rawVariants.map((v) => {
                      const label = buildVariantLabel(v);
                      const alreadyAdded = variantItems.some((i) => i.variantId === v.id);
                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="min-w-0 truncate">
                            {label}
                            <span className="ml-1 text-xs text-muted-foreground">
                              {formatIDR(v.price)} · stok {v.stock}
                            </span>
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant={alreadyAdded ? 'secondary' : 'outline'}
                            disabled={alreadyAdded}
                            onClick={() => addVariant(v, selectedProduct.name, productImg)}
                          >
                            <Plus className="h-3 w-3" />
                            {alreadyAdded ? 'Ditambahkan' : 'Tambah'}
                          </Button>
                        </div>
                      );
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-1 w-fit"
                      onClick={() => {
                        rawVariants.forEach((v) => {
                          if (!variantItems.some((i) => i.variantId === v.id)) {
                            addVariant(v, selectedProduct.name, productImg);
                          }
                        });
                      }}
                    >
                      Tambah Semua
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Separator className="my-3" />

            {/* Added variants list */}
            {variantItems.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Belum ada produk ditambahkan.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {variantItems.map((item) => (
                  <VariantRow
                    key={item.variantId}
                    item={item}
                    onChange={(updated) =>
                      setVariantItems((prev) =>
                        prev.map((i) => (i.variantId === updated.variantId ? updated : i)),
                      )
                    }
                    onRemove={() =>
                      setVariantItems((prev) =>
                        prev.filter((i) => i.variantId !== item.variantId),
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/sales-new')}>
              Batal
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {isEdit ? 'Simpan Perubahan' : 'Buat Sale'}
            </Button>
          </div>
        </form>
      </PageContainer>
    </AppShell>
  );
};

export default SaleFormPage;
