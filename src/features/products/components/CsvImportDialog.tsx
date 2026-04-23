import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { csvImportService } from '../services/csv-import.service';
import { useCsvImportStore } from '../stores/csv-import.store';

interface CsvImportDialogProps {
  trigger: React.ReactNode;
}

const CSV_MIME = ['text/csv', 'application/vnd.ms-excel', 'application/csv'];

const RESULT_META = {
  success: {
    Icon: CheckCircle2,
    title: 'Import selesai',
    tone: 'border-success/40 bg-success/5 text-success',
  },
  warning: {
    Icon: AlertCircle,
    title: 'Selesai dengan kendala',
    tone: 'border-warning/40 bg-warning/5 text-warning',
  },
  error: {
    Icon: XCircle,
    title: 'Import gagal',
    tone: 'border-destructive/40 bg-destructive/5 text-destructive',
  },
} as const;

const CsvImportDialogComponent = ({ trigger }: CsvImportDialogProps) => {
  const queryClient = useQueryClient();
  const {
    job,
    jobId,
    backendErrors,
    importResult,
    dialogOpen,
    setDialogOpen,
    startJob,
    clearResult,
  } = useCsvImportStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isJobActive =
    job !== null &&
    job.status !== 'completed' &&
    job.status !== 'completed_with_errors' &&
    job.status !== 'failed';

  const isBusy = isUploading || isJobActive;

  const progressPercent = useMemo(() => {
    if (isUploading) return uploadPercent;
    if (!job) return 0;
    if (job.status === 'completed' || job.status === 'completed_with_errors') return 100;
    return Math.max(0, Math.min(100, Number(job.progressPercent || 0)));
  }, [isUploading, uploadPercent, job]);

  const handleOpenChange = (open: boolean) => {
    if (!open && isBusy) {
      // Allow closing while running; watcher keeps polling.
      setDialogOpen(false);
      return;
    }
    setDialogOpen(open);
    if (!open) {
      setFile(null);
      setUploadPercent(0);
      if (importResult || backendErrors.length) clearResult();
    }
  };

  const handleFilePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    if (!picked) return setFile(null);

    const isCsv =
      CSV_MIME.includes(picked.type) || picked.name.toLowerCase().endsWith('.csv');
    if (!isCsv) {
      toast.error('Format tidak didukung', { description: 'Harus file .csv' });
      event.target.value = '';
      return;
    }
    setFile(picked);
  };

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadPercent(0);
    clearResult();

    try {
      const response = await csvImportService.import(file, (p) => setUploadPercent(p));
      const serve = response.serve;
      const startedJobId = serve?.id || serve?.job_id;

      if (!serve || !startedJobId) {
        toast.error('Upload gagal', {
          description: response.message || 'Respon server tidak valid',
        });
        return;
      }

      startJob(
        startedJobId,
        { ...serve, id: startedJobId },
        {
          onOpenDialog: (open) => setDialogOpen(open),
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.root });
          },
        },
      );

      toast.info('Upload diterima, memproses di background', {
        description: 'Kamu bisa menutup dialog ini — notifikasi muncul saat selesai.',
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const e = err as { message?: string; errors?: unknown[] };
      toast.error('Upload gagal', {
        description: e?.message || 'Gagal mengirim file ke server',
      });
    } finally {
      setIsUploading(false);
      setUploadPercent(0);
    }
  }, [file, clearResult, startJob, setDialogOpen, queryClient]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await csvImportService.export();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export CSV siap diunduh');
    } catch {
      toast.error('Export CSV gagal');
    } finally {
      setExporting(false);
    }
  };

  const resultMeta = importResult ? RESULT_META[importResult.type] : null;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import / Export Produk CSV</DialogTitle>
          <DialogDescription>
            Upload CSV untuk membuat atau memperbarui produk secara massal.
          </DialogDescription>
        </DialogHeader>

        {!isBusy && !importResult ? (
          <div className="flex flex-col gap-3">
            <label
              htmlFor="csv-file-input"
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/40',
              )}
            >
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {file ? file.name : 'Klik untuk memilih file CSV'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : 'Format .csv — maksimum sesuai konfigurasi server'}
                </span>
              </div>
              <input
                id="csv-file-input"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFilePick}
              />
            </label>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleExport}
                disabled={exporting}
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Menyiapkan...' : 'Export CSV saat ini'}
              </Button>
            </div>
          </div>
        ) : null}

        {isBusy ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {isUploading
                  ? 'Mengirim file ke server...'
                  : job?.currentProduct
                    ? `Memproses: ${job.currentProduct}`
                    : 'Memproses data...'}
              </span>
              <span className="text-muted-foreground">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} />
            {job && !isUploading ? (
              <div className="text-xs text-muted-foreground">
                {Number(job.processedProducts || 0)} / {Number(job.totalProducts || 0)} produk
                {jobId ? ` · Job ${jobId.slice(0, 8)}` : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {importResult && resultMeta ? (
          <div className="flex flex-col gap-3">
            <div
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3',
                resultMeta.tone,
              )}
            >
              <resultMeta.Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">{resultMeta.title}</span>
                <span className="text-xs">
                  {importResult.message ??
                    `Total ${importResult.successCount} · Baru ${importResult.created} · Diperbarui ${importResult.updated} · Varian baru ${importResult.variantCreated} · Media ${importResult.mediaCreated}${
                      importResult.errorCount
                        ? ` · Gagal ${importResult.errorCount}`
                        : ''
                    }`}
                </span>
              </div>
            </div>

            {backendErrors.length ? (
              <div className="flex max-h-52 flex-col gap-1 overflow-y-auto rounded-md border p-2 text-xs">
                {backendErrors.map((e, i) => (
                  <div key={i} className="flex gap-2 border-b py-1 last:border-0">
                    {e.row != null ? (
                      <span className="shrink-0 font-mono text-muted-foreground">
                        #{e.row}
                      </span>
                    ) : null}
                    <span className="min-w-0 wrap-break-word">
                      {e.name ? `${e.name} — ` : ''}
                      {e.message ?? 'Unknown error'}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          {importResult ? (
            <Button
              type="button"
              onClick={() => {
                clearResult();
                setDialogOpen(false);
              }}
            >
              Tutup
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isUploading}
              >
                Tutup
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!file || isBusy}
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Mengupload...' : 'Upload'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const CsvImportDialog = memo(CsvImportDialogComponent);
export default CsvImportDialog;
