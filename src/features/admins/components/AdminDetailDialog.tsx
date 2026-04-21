import { memo } from 'react';
import { Mail, Shield, Calendar, UserRound } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { Admin } from '../types';
import { formatCustomerDateTime } from '@/features/customers/utils/formatters';

interface AdminDetailDialogProps {
  admin: Admin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DetailRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClassName?: string;
}

const DetailRow = ({ icon: Icon, label, value, valueClassName }: DetailRowProps) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('break-words text-sm text-foreground', valueClassName)}>
        {value}
      </span>
    </div>
  </div>
);

const AdminDetailDialogComponent = ({
  admin,
  open,
  onOpenChange,
}: AdminDetailDialogProps) => {
  if (!admin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Admin</DialogTitle>
          <DialogDescription>
            Informasi user admin dan hak akses modul.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{admin.roleName || 'Admin'}</Badge>
            <Badge variant={admin.isActive ? 'default' : 'outline'}>
              {admin.isActive ? 'Aktif' : 'Nonaktif'}
            </Badge>
            <Badge variant="secondary">
              {admin.permissions.length} permission
            </Badge>
          </div>

          <div className="divide-y divide-border rounded-md border border-border px-4">
            <DetailRow icon={UserRound} label="Nama" value={admin.name || '-'} />
            <DetailRow icon={Mail} label="Email" value={admin.email || '-'} />
            <DetailRow icon={Shield} label="Role" value={admin.roleName || '-'} />
            <DetailRow
              icon={Calendar}
              label="Dibuat"
              value={formatCustomerDateTime(admin.createdAt)}
            />
          </div>

          {admin.permissions.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Permission yang dimiliki
              </span>
              <div className="flex flex-wrap gap-1">
                {admin.permissions.map((p) => (
                  <Badge key={p} variant="outline" className="font-mono text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const AdminDetailDialog = memo(AdminDetailDialogComponent);
