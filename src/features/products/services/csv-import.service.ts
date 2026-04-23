import axios from 'axios';
import { axiosClient } from '@/config/axios';
import type { ProductCsvImportResponse } from '../types';

const EP = {
  import: '/admin/product/import-csv',
  status: (jobId: string) => `/admin/product/import-csv/${jobId}/status`,
  export: '/admin/product/export-csv',
} as const;

export const csvImportService = {
  async import(
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<ProductCsvImportResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosClient.post<ProductCsvImportResponse>(EP.import, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
        onUploadProgress: (event) => {
          const total = event.total ?? 0;
          if (!total) return;
          const percent = Math.round((event.loaded * 100) / total);
          onProgress?.(percent);
        },
      });
      return response.data;
    } catch (error) {
      const message =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal upload CSV');
      const errors =
        (axios.isAxiosError(error) && error.response?.data?.errors) || [];
      throw { message, errors, status: axios.isAxiosError(error) ? error.response?.status : undefined };
    }
  },

  async getStatus(jobId: string): Promise<ProductCsvImportResponse> {
    const response = await axiosClient.get<ProductCsvImportResponse>(EP.status(jobId));
    return response.data;
  },

  async export(): Promise<Blob> {
    const response = await axiosClient.get<Blob>(EP.export, {
      responseType: 'blob',
      timeout: 0,
    });
    return response.data;
  },
};
