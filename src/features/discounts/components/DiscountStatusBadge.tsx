import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DISCOUNT_STATUS_LABELS, DiscountStatus } from '../types';

interface DiscountStatusBadgeProps {
  status: DiscountStatus;
}

const STATUS_CLASSES: Record<DiscountStatus, string> = {
  [DiscountStatus.Active]: 'bg-success/10 text-success border-success/20',
  [DiscountStatus.Upcoming]: 'bg-primary/10 text-primary border-primary/20',
  [DiscountStatus.Expired]: 'bg-muted text-muted-foreground border-border',
  [DiscountStatus.Inactive]: 'bg-error/10 text-error border-error/20',
};

const DiscountStatusBadgeComponent = ({ status }: DiscountStatusBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', STATUS_CLASSES[status])}
    >
      {DISCOUNT_STATUS_LABELS[status]}
    </Badge>
  );
};

export const DiscountStatusBadge = memo(DiscountStatusBadgeComponent);
