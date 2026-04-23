import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type {
  ProductDetail,
  ProductListItem,
  ProductListQuery,
  ProductReorderPayload,
} from '../types';

const PRODUCT_ENDPOINTS = {
  list: '/admin/product',
  detail: (id: number | string) => `/admin/product/${id}`,
  reorder: '/admin/product/update-order',
  variant: (id: number | string) => `/admin/product-variant/${id}`,
  exportCsv: '/admin/product/export-csv',
  importCsv: '/admin/product/import-csv',
  importStatus: (jobId: string) => `/admin/product/import-csv/${jobId}/status`,
  medias: (id: number | string) => `/admin/product/${id}/medias`,
  mediasBulk: (id: number | string) => `/admin/product/${id}/medias/bulk`,
} as const;

function buildListParams(filters: ProductListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.name) params.set('name', filters.name);
  if (filters.status) params.set('status', filters.status);
  if (filters.brandId != null) params.set('brand_id', String(filters.brandId));
  if (filters.isFlashsale !== undefined) {
    params.set('isFlashsale', filters.isFlashsale ? '1' : '0');
  }
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const productService = {
  async list(
    filters: ProductListQuery,
  ): Promise<AdonisPaginatedPayload<ProductListItem>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<ProductListItem>>
    >(`${PRODUCT_ENDPOINTS.list}?${params.toString()}`);
    return response.data.serve;
  },

  async getById(id: number | string): Promise<ProductDetail> {
    const response = await axiosClient.get<ServeWrapper<ProductDetail>>(
      PRODUCT_ENDPOINTS.detail(id),
    );
    return response.data.serve;
  },

  async create(payload: Record<string, unknown>): Promise<ProductDetail> {
    const response = await axiosClient.post<ServeWrapper<ProductDetail>>(
      PRODUCT_ENDPOINTS.list,
      payload,
      { timeout: 120_000 },
    );
    return response.data.serve;
  },

  async update(
    id: number | string,
    payload: Record<string, unknown>,
  ): Promise<ProductDetail> {
    const response = await axiosClient.put<ServeWrapper<ProductDetail>>(
      PRODUCT_ENDPOINTS.detail(id),
      payload,
      { timeout: 120_000 },
    );
    return response.data.serve;
  },

  async remove(id: number | string): Promise<void> {
    await axiosClient.delete(PRODUCT_ENDPOINTS.detail(id));
  },

  async reorder(payload: ProductReorderPayload): Promise<void> {
    await axiosClient.post(PRODUCT_ENDPOINTS.reorder, payload);
  },

  async updateVariant(
    variantId: number | string,
    payload: { stock?: number; price?: number | string },
  ): Promise<void> {
    await axiosClient.put(PRODUCT_ENDPOINTS.variant(variantId), payload);
  },

  async exportCsv(): Promise<Blob> {
    const response = await axiosClient.get(PRODUCT_ENDPOINTS.exportCsv, {
      responseType: 'blob',
      timeout: 0,
    });
    return response.data;
  },

  async importCsv(
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<ServeWrapper<{ jobId: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post<ServeWrapper<{ jobId: string }>>(
      PRODUCT_ENDPOINTS.importCsv,
      formData,
      {
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      },
    );
    return response.data;
  },

  async getImportStatus(jobId: string): Promise<ServeWrapper<unknown>> {
    const response = await axiosClient.get<ServeWrapper<unknown>>(
      PRODUCT_ENDPOINTS.importStatus(jobId),
    );
    return response.data;
  },
};
