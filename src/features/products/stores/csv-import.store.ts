import { create } from 'zustand';
import type {
  ProductCsvImportBackendError,
  ProductCsvImportJobStatusPayload,
} from '../types';

export interface CsvImportResult {
  type: 'success' | 'warning' | 'error';
  successCount: number;
  created: number;
  updated: number;
  variantCreated: number;
  mediaCreated: number;
  errorCount: number;
  message?: string;
}

interface CsvImportState {
  jobId: string | null;
  job: ProductCsvImportJobStatusPayload | null;
  backendErrors: ProductCsvImportBackendError[];
  importResult: CsvImportResult | null;
  dialogOpen: boolean;
  onOpenDialog: ((open: boolean) => void) | null;
  onSuccess: (() => void) | null;

  setDialogOpen: (open: boolean) => void;
  startJob: (
    jobId: string,
    initialJob: ProductCsvImportJobStatusPayload,
    callbacks: {
      onOpenDialog: (open: boolean) => void;
      onSuccess: () => void;
    },
  ) => void;
  updateJob: (job: ProductCsvImportJobStatusPayload) => void;
  setImportResult: (result: CsvImportResult) => void;
  clearResult: () => void;
  reset: () => void;
}

export const useCsvImportStore = create<CsvImportState>((set) => ({
  jobId: null,
  job: null,
  backendErrors: [],
  importResult: null,
  dialogOpen: false,
  onOpenDialog: null,
  onSuccess: null,

  setDialogOpen: (open) => set({ dialogOpen: open }),

  startJob: (jobId, initialJob, { onOpenDialog, onSuccess }) =>
    set({
      jobId,
      job: initialJob,
      backendErrors: [],
      importResult: null,
      onOpenDialog,
      onSuccess,
    }),

  updateJob: (job) =>
    set((s) => ({
      job,
      backendErrors: job.errors ?? s.backendErrors,
    })),

  setImportResult: (result) => set({ importResult: result }),

  clearResult: () =>
    set({ importResult: null, backendErrors: [], job: null, jobId: null }),

  reset: () =>
    set({
      jobId: null,
      job: null,
      backendErrors: [],
      importResult: null,
      dialogOpen: false,
      onOpenDialog: null,
      onSuccess: null,
    }),
}));
