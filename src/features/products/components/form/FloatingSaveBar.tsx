import { memo } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import { Loader2, Save, Undo2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { ProductFormValues } from '../../schemas';

interface FloatingSaveBarProps {
  isPending: boolean;
  canUndo: boolean;
  saveLabel: string;
}

const FloatingSaveBarComponent = ({
  isPending,
  canUndo,
  saveLabel,
}: FloatingSaveBarProps) => {
  const form = useFormContext<ProductFormValues>();
  const { isDirty } = useFormState({ control: form.control });

  return (
    <div
      className={cn(
        'pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ease-out',
        isDirty ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 shadow-lg',
          isDirty ? 'pointer-events-auto' : '',
        )}
      >
        <span className="pl-1 pr-3 text-xs font-medium text-muted-foreground">
          Perubahan belum disimpan
        </span>
        {canUndo ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => form.reset()}
            disabled={isPending}
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
};

export const FloatingSaveBar = memo(FloatingSaveBarComponent);
