import { memo } from 'react';
import { useFormContext } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import type { ProductFormValues } from '../../schemas';

const META_TITLE_RECOMMENDED = 60;
const META_DESCRIPTION_RECOMMENDED = 160;

const ProductFormSeoComponent = () => {
  const form = useFormContext<ProductFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Search Engine Optimization</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="meta_title"
          render={({ field }) => {
            const len = field.value?.length ?? 0;
            return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Meta Title</FormLabel>
                  <span
                    className={
                      len > META_TITLE_RECOMMENDED
                        ? 'text-xs text-error'
                        : 'text-xs text-muted-foreground'
                    }
                  >
                    {len} / {META_TITLE_RECOMMENDED}
                  </span>
                </div>
                <FormControl>
                  <Input placeholder="Product title for search engines" {...field} />
                </FormControl>
                <FormDescription>Shown in search results and browser tab</FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="meta_description"
          render={({ field }) => {
            const len = field.value?.length ?? 0;
            return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Meta Description</FormLabel>
                  <span
                    className={
                      len > META_DESCRIPTION_RECOMMENDED
                        ? 'text-xs text-error'
                        : 'text-xs text-muted-foreground'
                    }
                  >
                    {len} / {META_DESCRIPTION_RECOMMENDED}
                  </span>
                </div>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Short description shown in search results"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="meta_keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meta Keywords</FormLabel>
              <FormControl>
                <Input placeholder="comma, separated, keywords" {...field} />
              </FormControl>
              <FormDescription>Separate keywords with commas</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export const ProductFormSeo = memo(ProductFormSeoComponent);
