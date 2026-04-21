import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FLASH_SALE_STATUS_LABELS, FlashSaleStatus } from '../types';

interface FlashSaleStatusBadgeProps {
  status: FlashSaleStatus;
}

const STATUS_CLASSES: Record<FlashSaleStatus, string> = {
  [FlashSaleStatus.Active]: 'bg-success/10 text-success border-success/20',
  [FlashSaleStatus.Upcoming]: 'bg-primary/10 text-primary border-primary/20',
  [FlashSaleStatus.Ended]: 'bg-muted text-muted-foreground border-border',
  [FlashSaleStatus.Draft]: 'bg-warning/10 text-warning border-warning/20',
};

const FlashSaleStatusBadgeComponent = ({ status }: FlashSaleStatusBadgeProps) => (
  <Badge variant="outline" className={cn('font-medium', STATUS_CLASSES[status])}>
    {FLASH_SALE_STATUS_LABELS[status]}
  </Badge>
);

export const FlashSaleStatusBadge = memo(FlashSaleStatusBadgeComponent);
