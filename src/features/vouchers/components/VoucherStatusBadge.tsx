import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  VOUCHER_STATUS_LABELS,
  type VoucherStatus,
} from '../utils/derive-status';

interface VoucherStatusBadgeProps {
  status: VoucherStatus;
}

const STATUS_CLASSES: Record<VoucherStatus, string> = {
  active: 'bg-success/10 text-success border-success/20',
  upcoming: 'bg-primary/10 text-primary border-primary/20',
  expired: 'bg-muted text-muted-foreground border-border',
  inactive: 'bg-error/10 text-error border-error/20',
  sold_out: 'bg-warning/10 text-warning border-warning/20',
};

const VoucherStatusBadgeComponent = ({ status }: VoucherStatusBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', STATUS_CLASSES[status])}
    >
      {VOUCHER_STATUS_LABELS[status]}
    </Badge>
  );
};

export const VoucherStatusBadge = memo(VoucherStatusBadgeComponent);
