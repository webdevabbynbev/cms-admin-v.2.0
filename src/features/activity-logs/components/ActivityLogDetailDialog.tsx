import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { ActivityLog } from '../types';
import { formatCustomerDateTime } from '@/features/customers/utils/formatters';

interface ActivityLogDetailDialogProps {
  log: ActivityLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ActivityLogDetailDialogComponent = ({
  log,
  open,
  onOpenChange,
}: ActivityLogDetailDialogProps) => {
  if (!log) return null;

  const json = log.dataArray ?? log.data;
  const jsonText =
    typeof json === 'object' && json !== null
      ? JSON.stringify(json, null, 2)
      : typeof json === 'string'
        ? json
        : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Aktivitas</DialogTitle>
          <DialogDescription>
            {formatCustomerDateTime(log.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Nama</span>
              <span className="text-sm font-medium">{log.userName || '-'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Role</span>
              <Badge variant="secondary" className="w-fit">
                {log.roleName || '-'}
              </Badge>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Modul</span>
              <Badge variant="outline" className="w-fit">
                {log.menu || '-'}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs text-muted-foreground">Aktivitas</span>
              <span className="text-sm">{log.activity || '-'}</span>
            </div>
          </div>

          {jsonText ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Data
              </span>
              <ScrollArea className="h-64 rounded-md border border-border bg-muted/30">
                <pre className="whitespace-pre-wrap break-words p-3 text-xs font-mono">
                  {jsonText}
                </pre>
              </ScrollArea>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ActivityLogDetailDialog = memo(ActivityLogDetailDialogComponent);
