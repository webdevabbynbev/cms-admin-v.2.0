import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useCsvImportStore } from '../stores/csv-import.store';
import { csvImportService } from '../services/csv-import.service';
import type { ProductCsvImportJobStatusPayload } from '../services/csv-import.service';

function getSnapshotPercent(s: ProductCsvImportJobStatusPayload): number {
  if (s.status === 'completed' || s.status === 'completed_with_errors') return 100;
  return Math.max(0, Math.min(100, Number(s.progressPercent || 0)));
}

function getSuccessfulProducts(s: ProductCsvImportJobStatusPayload): number {
  const statsCount =
    Number(s.stats?.productCreated || 0) + Number(s.stats?.productUpdated || 0);
  if (statsCount > 0) return statsCount;
  const direct = Number(s.successfulProducts || 0);
  if (direct > 0) return direct;
  return Number(s.processedProducts || 0);
}

const CsvImportWatcher = () => {
  const { jobId, job, updateJob, setImportResult, onOpenDialog, onSuccess, dialogOpen } =
    useCsvImportStore();
  const dialogOpenRef = useRef(dialogOpen);
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    dialogOpenRef.current = dialogOpen;
  }, [dialogOpen]);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;
    const currentJobId = jobId;

    const handleDone = (snapshot: ProductCsvImportJobStatusPayload) => {
      if (handledRef.current === currentJobId) return;
      handledRef.current = currentJobId;

      const successCount = getSuccessfulProducts(snapshot);
      const errorCount = Number(snapshot.errorCount || 0);
      const created = Number(snapshot.stats?.productCreated || 0);
      const updated = Number(snapshot.stats?.productUpdated || 0);
      const variantCreated = Number(snapshot.stats?.variantCreated || 0);
      const mediaCreated = Number(snapshot.stats?.mediaCreated || 0);

      if (snapshot.status === 'completed') {
        setImportResult({
          type: 'success',
          successCount,
          created,
          updated,
          variantCreated,
          mediaCreated,
          errorCount: 0,
        });
        onOpenDialog?.(true);
        onSuccess?.();
        toast.success('Upload produk selesai', {
          description: [
            `Total: ${successCount}`,
            created > 0 ? `Baru: ${created}` : null,
            updated > 0 ? `Diperbarui: ${updated}` : null,
          ]
            .filter(Boolean)
            .join(' · '),
          duration: 6000,
        });
        return;
      }

      if (snapshot.status === 'completed_with_errors') {
        setImportResult({
          type: 'warning',
          successCount,
          created,
          updated,
          variantCreated,
          mediaCreated,
          errorCount,
        });
        onOpenDialog?.(true);
        onSuccess?.();
        toast.warning('Selesai dengan kendala', {
          description: `Berhasil: ${successCount} · Gagal: ${errorCount}. Buka dialog upload untuk detail error.`,
          duration: 8000,
        });
        return;
      }

      setImportResult({
        type: 'error',
        successCount: 0,
        created: 0,
        updated: 0,
        variantCreated: 0,
        mediaCreated: 0,
        errorCount: 0,
        message: snapshot.message || 'Import gagal',
      });
      onOpenDialog?.(true);
      toast.error('Import gagal', {
        description: snapshot.message || 'Import gagal',
        duration: 6000,
      });
    };

    const poll = async () => {
      try {
        const res = await csvImportService.getStatus(currentJobId);
        if (cancelled) return;
        const snap = res?.serve;
        if (!snap) return;

        updateJob({ ...snap, id: snap.id || currentJobId });

        if (
          snap.status === 'completed' ||
          snap.status === 'completed_with_errors' ||
          snap.status === 'failed'
        ) {
          cancelled = true;
          handleDone(snap);
        }
      } catch {
        // swallow polling errors
      }
    };

    void poll();
    const id = window.setInterval(() => void poll(), 1500);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [jobId, updateJob, setImportResult, onOpenDialog, onSuccess]);

  // Hide floating card while upload dialog is open or job is done.
  const isActive =
    job !== null &&
    job.status !== 'completed' &&
    job.status !== 'completed_with_errors' &&
    job.status !== 'failed' &&
    !dialogOpen;

  if (!isActive || !job) return null;

  const percent = getSnapshotPercent(job);
  const isDone = percent >= 100;
  const processed = Number(job.processedProducts || 0);
  const total = Number(job.totalProducts || 0);
  const valueText = total > 0 ? `${processed}/${total}` : null;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[340px] animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-background p-3 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Mengupload produk</span>
          <span
            className={cn(
              'whitespace-nowrap text-xs',
              isDone ? 'font-semibold text-success' : 'text-muted-foreground',
            )}
          >
            {isDone ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
              </span>
            ) : (
              `${percent}%`
            )}
          </span>
        </div>
        <Progress value={percent} />
        {!isDone && (valueText || job.currentProduct) ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="min-w-0 flex-1 truncate">{job.currentProduct ?? ''}</span>
            {valueText ? <span className="shrink-0 whitespace-nowrap">{valueText}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CsvImportWatcher;
