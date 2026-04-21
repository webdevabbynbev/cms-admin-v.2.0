import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlashSaleFormActionsProps {
  isEdit: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
}

const FlashSaleFormActionsComponent = ({
  isEdit,
  isSubmitting,
  onCancel,
}: FlashSaleFormActionsProps) => (
  <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-md sm:border">
    <div className="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Batal
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isEdit ? 'Simpan Perubahan' : 'Buat Flash Sale'}
      </Button>
    </div>
  </div>
);

export const FlashSaleFormActions = memo(FlashSaleFormActionsComponent);
