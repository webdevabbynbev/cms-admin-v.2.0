export interface ProductCsvImportBackendError {
  row?: number | string;
  message?: string;
  name?: string;
}

export interface ProductCsvImportJobStatusPayload {
  id: string;
  fileName?: string | null;
  mode?: 'master' | 'template' | null;
  status:
    | 'queued'
    | 'processing'
    | 'completed'
    | 'completed_with_errors'
    | 'failed';
  message?: string;
  totalProducts?: number;
  processedProducts?: number;
  progressPercent?: number;
  successfulProducts?: number;
  errorCount?: number;
  errors?: ProductCsvImportBackendError[];
  currentProduct?: string | null;
  stats?: {
    productCreated?: number;
    productUpdated?: number;
    variantCreated?: number;
    mediaCreated?: number;
    tagAttached?: number;
    concernAttached?: number;
    variantAttrAttached?: number;
    onlineCreated?: number;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  finishedAt?: string | null;
  job_id?: string;
  status_url?: string;
}

export interface ProductCsvImportResponse {
  message?: string;
  serve?: ProductCsvImportJobStatusPayload;
  errors?: ProductCsvImportBackendError[];
}
