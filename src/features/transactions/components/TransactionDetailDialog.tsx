import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTransactionDetail } from '../hooks';
import type { Transaction } from '../types';
import { formatIDR } from '@/features/reports/utils/formatters';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  '1': 'Belum Bayar',
  '2': 'Packing',
  '3': 'Dikirim',
  '4': 'Selesai',
  '5': 'Sudah Bayar',
  '6': 'Diterima',
  '9': 'Dibatalkan',
};

function statusClass(status: string): string {
  if (status === '9') return 'bg-destructive/10 text-destructive border-destructive/30';
  if (status === '4' || status === '6') return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400';
  if (status === '5') return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
  if (status === '3') return 'bg-primary/10 text-primary border-primary/30';
  return 'bg-secondary text-secondary-foreground';
}

interface TransactionDetailDialogProps {
  transactionId: number | null;
  transaction: Transaction | null;
  onClose: () => void;
}

const TransactionDetailDialogComponent = ({
  transactionId,
  transaction,
  onClose,
}: TransactionDetailDialogProps) => {
  const { data: detail, isLoading } = useTransactionDetail(transactionId);
  const tx = detail ?? transaction;

  return (
    <Dialog open={transactionId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Detail Transaksi{tx ? ` — ${tx.transactionNumber}` : ''}
          </DialogTitle>
        </DialogHeader>

        {isLoading && !tx ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Memuat...</div>
        ) : tx ? (
          <div className="flex flex-col gap-4 text-sm">
            {/* Status + Amount */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium',
                  statusClass(tx.transactionStatus),
                )}
              >
                {STATUS_LABELS[tx.transactionStatus] ?? tx.transactionStatus}
              </span>
              <span className="text-base font-semibold">{formatIDR(tx.amount)}</span>
            </div>

            {/* Customer */}
            {tx.user ? (
              <>
                <Separator />
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pelanggan
                  </p>
                  <p className="font-medium">
                    {[tx.user.firstName, tx.user.lastName].filter(Boolean).join(' ') || '-'}
                  </p>
                  <p className="text-muted-foreground">{tx.user.email}</p>
                  {tx.user.phoneNumber ? (
                    <p className="text-muted-foreground">{tx.user.phoneNumber}</p>
                  ) : null}
                </div>
              </>
            ) : null}

            {/* Shipment */}
            {tx.shipments.length > 0 ? (
              <>
                <Separator />
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pengiriman
                  </p>
                  {tx.shipments.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center gap-2">
                      {s.courier ? (
                        <Badge variant="outline">{s.courier}</Badge>
                      ) : null}
                      {s.service ? (
                        <Badge variant="outline">{s.service}</Badge>
                      ) : null}
                      {s.resiNumber ? (
                        <span className="font-mono text-xs">{s.resiNumber}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Resi belum ada</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {/* Items */}
            {tx.details.length > 0 ? (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Item ({tx.details.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {tx.details.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-start gap-3 rounded-md border border-border p-2"
                      >
                        {d.imageUrl ? (
                          <img
                            src={d.imageUrl}
                            alt={d.productName}
                            className="h-12 w-12 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 shrink-0 rounded bg-muted" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{d.productName}</p>
                          {d.variantName ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {d.variantName}
                            </p>
                          ) : null}
                          <p className="mt-0.5 text-xs">
                            {d.qty}x {formatIDR(d.price)}
                            {d.discount > 0 ? (
                              <span className="ml-1 text-destructive">
                                -{formatIDR(d.discount)}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {/* Date */}
            {tx.createdAt ? (
              <>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  Dibuat:{' '}
                  {new Date(tx.createdAt).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export const TransactionDetailDialog = memo(TransactionDetailDialogComponent);
