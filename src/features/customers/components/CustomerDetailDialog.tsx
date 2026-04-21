import { memo } from 'react';
import { Mail, Phone, Calendar, MapPin, UserRound, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import {
  CUSTOMER_GENDER_LABELS,
  CustomerGender,
} from '../types';
import type { Customer } from '../types';
import {
  formatCustomerDate,
  formatCustomerDateTime,
  formatCustomerPhone,
} from '../utils/formatters';

interface CustomerDetailDialogProps {
  customer: Customer | null;
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

const CustomerDetailDialogComponent = ({
  customer,
  open,
  onOpenChange,
}: CustomerDetailDialogProps) => {
  if (!customer) return null;

  const initials = (customer.name || customer.email || '?')
    .split(' ')
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const gender =
    customer.gender === CustomerGender.Unspecified
      ? '-'
      : CUSTOMER_GENDER_LABELS[customer.gender];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Customer</DialogTitle>
          <DialogDescription>
            Data customer hanya untuk dilihat (read-only).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              {customer.photoProfileUrl ? (
                <AvatarImage src={customer.photoProfileUrl} alt={customer.name} />
              ) : null}
              <AvatarFallback>{initials || 'CU'}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base font-semibold text-foreground">
                {customer.name || '-'}
              </span>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {customer.crmTier ? (
                  <Badge variant="secondary">{customer.crmTier}</Badge>
                ) : null}
                <Badge variant={customer.isActive ? 'default' : 'outline'}>
                  {customer.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
                {customer.roleName ? (
                  <Badge variant="outline">{customer.roleName}</Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="divide-y divide-border rounded-md border border-border px-4">
            <DetailRow icon={Mail} label="Email" value={customer.email || '-'} />
            <DetailRow
              icon={Phone}
              label="Nomor Telepon"
              value={formatCustomerPhone(customer.phone, customer.phoneNumber)}
            />
            <DetailRow icon={UserRound} label="Gender" value={gender} />
            <DetailRow
              icon={Calendar}
              label="Tanggal Lahir"
              value={formatCustomerDate(customer.dob)}
            />
            <DetailRow
              icon={MapPin}
              label="Alamat"
              value={customer.address ?? '-'}
            />
            {customer.referralCode ? (
              <DetailRow
                icon={Star}
                label="Kode Referral"
                value={customer.referralCode}
                valueClassName="font-mono"
              />
            ) : null}
            <DetailRow
              icon={Calendar}
              label="Terdaftar"
              value={formatCustomerDateTime(customer.createdAt)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const CustomerDetailDialog = memo(CustomerDetailDialogComponent);
