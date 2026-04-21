import { memo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';

import type { ProductFormValues } from '../../schemas';
import { MediaUploader } from './MediaUploader';

const ProductFormMediaComponent = () => {
  const form = useFormContext<ProductFormValues>();
  const medias = useWatch({ control: form.control, name: 'medias' }) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Product Media</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="medias"
          render={() => (
            <FormItem>
              <MediaUploader
                value={medias}
                onChange={(next) => form.setValue('medias', next, { shouldDirty: true })}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export const ProductFormMedia = memo(ProductFormMediaComponent);
