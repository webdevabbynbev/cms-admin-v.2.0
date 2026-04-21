import { memo, useEffect, useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import {
  defaultBrandFormValues,
  brandFormSchema,
  type BrandFormValues,
} from '../schemas';
import {
  useCreateBrand,
  useUpdateBrand,
  useUploadBrandLogo,
  useUploadBrandBanner,
} from '../hooks';
import type { Brand } from '../types';

interface BrandFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: Brand | null;
}

const BrandFormDialogComponent = ({
  open,
  onOpenChange,
  brand,
}: BrandFormDialogProps) => {
  const isEdit = Boolean(brand);
  const { mutateAsync: createBrand } = useCreateBrand();
  const { mutateAsync: updateBrand } = useUpdateBrand();
  const { mutateAsync: uploadLogo, isPending: isUploadingLogo } = useUploadBrandLogo();
  const { mutateAsync: uploadBanner, isPending: isUploadingBanner } = useUploadBrandBanner();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema) as Resolver<BrandFormValues>,
    defaultValues: defaultBrandFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    if (brand) {
      form.reset({
        name: brand.name,
        description: brand.description ?? '',
        country: brand.country ?? '',
        website: brand.website ?? '',
        isActive: brand.isActive,
      });
      setLogoPreview(brand.logoUrl);
      setBannerPreview(brand.bannerUrl);
    } else {
      form.reset(defaultBrandFormValues);
      setLogoPreview(null);
      setBannerPreview(null);
    }
  }, [open, brand, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        country: values.country?.trim() || null,
        website: values.website?.trim() || null,
        isActive: (values.isActive ? 1 : 0) as 0 | 1,
      };
      if (isEdit && brand) {
        await updateBrand({ slug: brand.slug, payload });
        toast.success('Brand berhasil diupdate');
      } else {
        await createBrand(payload);
        toast.success('Brand berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan brand');
      toast.error(msg);
    }
  });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !brand?.slug) return;
    try {
      const updated = await uploadLogo({ slug: brand.slug, file });
      setLogoPreview(updated.logoUrl);
      toast.success('Logo berhasil diupload');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Gagal upload logo';
      toast.error(msg);
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !brand?.slug) return;
    try {
      const updated = await uploadBanner({ slug: brand.slug, file });
      setBannerPreview(updated.bannerUrl);
      toast.success('Banner berhasil diupload');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Gagal upload banner';
      toast.error(msg);
    } finally {
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Brand' : 'Tambah Brand'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Logo dan banner bisa diupload setelah brand ini tersimpan.'
              : 'Upload logo/banner tersedia setelah brand dibuat.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brand-name">Nama</Label>
            <Input id="brand-name" {...form.register('name')} placeholder="Nama brand" />
            {form.formState.errors.name ? (
              <span className="text-xs text-error">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brand-desc">Deskripsi</Label>
            <Textarea
              id="brand-desc"
              {...form.register('description')}
              placeholder="Deskripsi brand"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="brand-country">Negara</Label>
              <Input
                id="brand-country"
                {...form.register('country')}
                placeholder="Contoh: Indonesia"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="brand-website">Website</Label>
              <Input
                id="brand-website"
                {...form.register('website')}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label className="text-sm">Status Aktif</Label>
            <Switch
              checked={form.watch('isActive')}
              onCheckedChange={(v) => form.setValue('isActive', v)}
            />
          </div>

          {isEdit ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2 rounded-md border border-border p-3">
                <Label className="text-sm font-medium">Logo</Label>
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="h-24 w-24 rounded-md border border-border object-contain"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                    <Image className="h-6 w-6" />
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload Logo
                </Button>
              </div>

              <div className="flex flex-col gap-2 rounded-md border border-border p-3">
                <Label className="text-sm font-medium">Banner</Label>
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner"
                    className="h-24 w-full rounded-md border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-full items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                    <Image className="h-6 w-6" />
                  </div>
                )}
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                >
                  {isUploadingBanner ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload Banner
                </Button>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {isEdit ? 'Simpan' : 'Buat'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const BrandFormDialog = memo(BrandFormDialogComponent);
