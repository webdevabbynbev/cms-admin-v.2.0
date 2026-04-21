import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import {
  DATE_RANGE_PRESET_LABELS,
  DateRangePreset,
} from '../types';
import {
  buildRangeFromPreset,
  datetimeLocalToIso,
  isoToDatetimeLocal,
  type DateRangeValue,
} from '../utils/date-range';

interface ReportDateFilterProps {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
}

const PRESET_ORDER: DateRangePreset[] = [
  DateRangePreset.Today,
  DateRangePreset.Last7Days,
  DateRangePreset.ThisMonth,
  DateRangePreset.Custom,
];

const ReportDateFilterComponent = ({
  value,
  onChange,
}: ReportDateFilterProps) => {
  const [draftStart, setDraftStart] = useState(() => isoToDatetimeLocal(value.startIso));
  const [draftEnd, setDraftEnd] = useState(() => isoToDatetimeLocal(value.endIso));

  const handlePreset = (preset: DateRangePreset) => {
    if (preset === DateRangePreset.Custom) {
      onChange({ ...value, preset });
      return;
    }
    onChange(buildRangeFromPreset(preset));
  };

  const handleApplyCustom = () => {
    if (!draftStart || !draftEnd) {
      toast.error('Tanggal mulai dan akhir wajib diisi');
      return;
    }
    const startIso = datetimeLocalToIso(draftStart);
    const endIso = datetimeLocalToIso(draftEnd);
    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      toast.error('Tanggal akhir harus setelah tanggal mulai');
      return;
    }
    onChange({ preset: DateRangePreset.Custom, startIso, endIso });
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {PRESET_ORDER.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                value.preset === preset &&
                  'border-primary bg-primary/5 text-primary',
              )}
              onClick={() => handlePreset(preset)}
            >
              {DATE_RANGE_PRESET_LABELS[preset]}
            </Button>
          ))}
        </div>

        {value.preset === DateRangePreset.Custom ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Tanggal Mulai</Label>
              <Input
                type="datetime-local"
                value={draftStart}
                onChange={(e) => setDraftStart(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Tanggal Akhir</Label>
              <Input
                type="datetime-local"
                value={draftEnd}
                onChange={(e) => setDraftEnd(e.target.value)}
              />
            </div>
            <Button type="button" onClick={handleApplyCustom}>
              Terapkan
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export const ReportDateFilter = memo(ReportDateFilterComponent);
