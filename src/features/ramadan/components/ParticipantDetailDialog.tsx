import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

import type { RamadanParticipant } from '../types';

interface ParticipantDetailDialogProps {
  participant: RamadanParticipant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col border-b border-border py-2 last:border-b-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="break-words text-sm text-foreground">{value}</span>
  </div>
);

const ParticipantDetailDialogComponent = ({
  participant,
  open,
  onOpenChange,
}: ParticipantDetailDialogProps) => {
  if (!participant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{participant.name}</DialogTitle>
          <DialogDescription>{participant.email}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">
              {participant.totalFasting} hari puasa
            </Badge>
            <Badge variant="outline">
              {participant.totalNotFasting} hari tidak
            </Badge>
            {participant.spinResult ? (
              <Badge variant="secondary">Spin: {participant.spinResult}</Badge>
            ) : null}
          </div>

          <div className="rounded-md border border-border px-4">
            <DetailRow label="Nomor Telepon" value={participant.phoneNumber || '-'} />
            <DetailRow label="Alamat" value={participant.address || '-'} />
            <DetailRow
              label="Alasan Tidak Puasa"
              value={participant.notFastingReasons || '-'}
            />
            <DetailRow label="Hadiah Hari 7" value={participant.prize7 || '-'} />
            <DetailRow label="Hadiah Hari 15" value={participant.prize15 || '-'} />
            <DetailRow label="Hadiah Hari 30" value={participant.prize30 || '-'} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ParticipantDetailDialog = memo(ParticipantDetailDialogComponent);
