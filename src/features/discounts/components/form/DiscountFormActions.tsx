import { memo } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiscountFormActionsProps {
  isSubmitting: boolean;
  isEdit: boolean;
  onCancel: () => void;
}

const DiscountFormActionsComponent = ({
  isSubmitting,
  isEdit,
  onCancel,
}: DiscountFormActionsProps) => {
  return (
    <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-border bg-background/95 p-4 backdrop-blur sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        <X className="h-4 w-4" />
        Batal
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {isEdit ? 'Simpan Perubahan' : 'Buat Diskon'}
      </Button>
    </div>
  );
};

export const DiscountFormActions = memo(DiscountFormActionsComponent);
