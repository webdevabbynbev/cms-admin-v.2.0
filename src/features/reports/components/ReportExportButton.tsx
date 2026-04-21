import { memo, useState } from 'react';
import { Download, Loader2, ChevronDown } from 'lucide-react';
import moment from 'moment-timezone';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { reportService } from '../services';
import type { CreateReportPayload } from '../types';
import { ReportFormat } from '../types';

interface ReportExportButtonProps {
  buildRequest: (format: ReportFormat) => CreateReportPayload;
  fileNamePrefix: string;
  formats?: Array<ReportFormat.Excel | ReportFormat.Csv>;
  disabled?: boolean;
}

const DEFAULT_FORMATS: Array<ReportFormat.Excel | ReportFormat.Csv> = [
  ReportFormat.Excel,
  ReportFormat.Csv,
];

const FORMAT_LABELS: Record<ReportFormat.Excel | ReportFormat.Csv, string> = {
  [ReportFormat.Excel]: 'Export ke Excel (.xlsx)',
  [ReportFormat.Csv]: 'Export ke CSV (.csv)',
};

const getExtension = (format: ReportFormat.Excel | ReportFormat.Csv) =>
  format === ReportFormat.Excel ? 'xlsx' : 'csv';

const ReportExportButtonComponent = ({
  buildRequest,
  fileNamePrefix,
  formats = DEFAULT_FORMATS,
  disabled = false,
}: ReportExportButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: ReportFormat.Excel | ReportFormat.Csv) => {
    setLoading(true);
    try {
      const payload = buildRequest(format);
      const report = await reportService.createAndWait(payload);
      const blob = await reportService.download(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileNamePrefix}-${moment().format('YYYYMMDD')}.${getExtension(format)}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Laporan ${format.toUpperCase()} berhasil diunduh`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Gagal mengunduh laporan';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={disabled || loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((f) => (
          <DropdownMenuItem key={f} onClick={() => handleExport(f)}>
            {FORMAT_LABELS[f]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const ReportExportButton = memo(ReportExportButtonComponent);
