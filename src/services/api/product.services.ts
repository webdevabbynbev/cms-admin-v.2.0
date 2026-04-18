import http from "../../api/http";

export type ProductCsvImportBackendError = {
  row?: number | string;
  message?: string;
  name?: string;
};

export type ProductCsvImportJobStatusPayload = {
  id: string;
  fileName?: string | null;
  mode?: "master" | "template" | null;
  status:
    | "queued"
    | "processing"
    | "completed"
    | "completed_with_errors"
    | "failed";
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
};

type ProductCsvImportResponse = {
  message?: string;
  serve?: ProductCsvImportJobStatusPayload;
  errors?: ProductCsvImportBackendError[];
};

/**
 * Upload CSV product
 * @param file File CSV
 * @param onProgress callback progress (0 - 100)
 */
export async function importProductCSV(
  file: File,
  onProgress?: (percent: number) => void,
) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await http.post(
      // ✅ jangan dobel /api/v1, karena baseURL biasanya sudah .../api/v1
      "/admin/product/import-csv",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000,
        onUploadProgress: (event) => {
          const total = event.total ?? 0;
          if (!total) return;
          const percent = Math.round((event.loaded * 100) / total);
          onProgress?.(percent);
        },
      },
    );

    return response.data as ProductCsvImportResponse;
  } catch (error: any) {
    

    // ✅ jangan throw object "baru" doang, simpan juga status/message asli biar UI gampang debug
    const message =
      error?.response?.data?.message || error?.message || "Gagal upload CSV";

    const errors = error?.response?.data?.errors || [];

    throw {
      message,
      errors,
      status: error?.response?.status,
      raw: error?.response?.data,
    };
  }
}

export async function getProductCsvImportStatus(jobId: string) {
  const response = await http.get(`/admin/product/import-csv/${jobId}/status`);
  return response.data as ProductCsvImportResponse;
}

/**
 * Export Product CSV
 * Endpoint: GET /api/v1/product/export-csv
 */
export async function exportProductCSV() {
  // timeout: 0 = unlimited — export can take a long time for large catalogs
  const response = await http.get("/admin/product/export-csv", {
    responseType: "blob",
    timeout: 0,
  });
  return response.data;
}
