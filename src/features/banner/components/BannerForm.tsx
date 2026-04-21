import { memo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import {
  bannerFormSchema,
  defaultBannerFormValues,
  type BannerFormValues,
} from '../schemas';
import {
  BANNER_POSITION_LABELS,
  BANNER_TYPE_LABELS,
  BannerPosition,
  BannerType,
  type Banner,
} from '../types';
import { useCreateBanner, useUpdateBanner } from '../hooks';
import { BannerImagePicker } from './BannerImagePicker';

interface BannerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: Banner | null;
}

const BannerFormComponent = ({ open, onOpenChange, banner }: BannerFormProps) => {
  const isEdit = banner !== null;
  const { mutateAsync: createBanner, isPending: isCreating } = useCreateBanner();
  const { mutateAsync: updateBanner, isPending: isUpdating } = useUpdateBanner();

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: defaultBannerFormValues,
  });

  const hasButton = useWatch({ control: form.control, name: 'has_button' });
  const imageFile = useWatch({ control: form.control, name: 'image_file' });
  const imageMobileFile = useWatch({ control: form.control, name: 'image_mobile_file' });
  const imageUrl = useWatch({ control: form.control, name: 'image_url' });
  const imageMobileUrl = useWatch({ control: form.control, name: 'image_mobile_url' });

  useEffect(() => {
    if (open) {
      if (banner) {
        form.reset({
          title: banner.title,
          description: banner.description ?? '',
          position: banner.position ?? BannerPosition.BottomLeft,
          banner_type: banner.bannerType ?? BannerType.General,
          has_button: Boolean(banner.hasButton),
          button_text: banner.buttonText ?? '',
          button_url: banner.buttonUrl ?? '',
          image_url: banner.image ?? '',
          image_mobile_url: banner.imageMobile ?? '',
          image_file: null,
          image_mobile_file: null,
        });
      } else {
        form.reset(defaultBannerFormValues);
      }
    }
  }, [open, banner, form]);

  const onSubmit = async (values: BannerFormValues) => {
    try {
      const payload = {
        title: values.title,
        description: values.description,
        position: values.position,
        banner_type: values.banner_type,
        has_button: values.has_button,
        button_text: values.has_button ? values.button_text : undefined,
        button_url: values.has_button ? values.button_url : undefined,
        image_url: values.image_url || undefined,
        image_mobile_url: values.image_mobile_url || undefined,
        image_file: values.image_file,
        image_mobile_file: values.image_mobile_file,
      };

      if (isEdit && banner) {
        await updateBanner({ id: banner.id, payload });
        toast.success('Banner updated');
      } else {
        await createBanner(payload);
        toast.success('Banner created');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Failed to save banner');
      toast.error(msg);
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Banner' : 'New Banner'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update banner information.' : 'Create a new banner for your storefront.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Banner title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="banner_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(BannerType).map((v) => (
                          <SelectItem key={v} value={v}>
                            {BANNER_TYPE_LABELS[v]}
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
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text Position</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(BannerPosition).map((v) => (
                          <SelectItem key={v} value={v}>
                            {BANNER_POSITION_LABELS[v]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="image_file"
                render={() => (
                  <FormItem>
                    <BannerImagePicker
                      label="Desktop Image"
                      file={imageFile}
                      existingUrl={imageUrl}
                      onFileChange={(f) => {
                        form.setValue('image_file', f, { shouldDirty: true });
                        if (f) form.setValue('image_url', '');
                      }}
                      onUrlClear={() => form.setValue('image_url', '')}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image_mobile_file"
                render={() => (
                  <FormItem>
                    <BannerImagePicker
                      label="Mobile Image (optional)"
                      file={imageMobileFile}
                      existingUrl={imageMobileUrl}
                      onFileChange={(f) => {
                        form.setValue('image_mobile_file', f, { shouldDirty: true });
                        if (f) form.setValue('image_mobile_url', '');
                      }}
                      onUrlClear={() => form.setValue('image_mobile_url', '')}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="has_button"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="flex flex-col gap-1">
                    <FormLabel>Show Button</FormLabel>
                    <span className="text-xs text-muted-foreground">
                      Display a call-to-action button on the banner
                    </span>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {hasButton ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="button_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Shop Now" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="button_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button URL</FormLabel>
                      <FormControl>
                        <Input placeholder="/products or https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isEdit ? 'Save Changes' : 'Create Banner'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export const BannerForm = memo(BannerFormComponent);
