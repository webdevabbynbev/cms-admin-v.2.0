import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload } from '@/features/products/types';
import type {
  Discount,
  DiscountBrandOption,
  DiscountFormPayload,
  DiscountImportParams,
  DiscountListQuery,
  DiscountOptionQuery,
  DiscountProductOption,
  DiscountStatusPayload,
  DiscountVariantOption,
} from '../types';
import {
  normalizeDiscount,
  normalizeDiscountBrandOption,
  normalizeDiscountProductOption,
  normalizeDiscountVariantOption,
} from '../utils/normalize';

const DISCOUNT_ENDPOINTS = {
  list: '/admin/discounts',
  detail: (identifier: string | number) =>
    `/admin/discounts/${encodeURIComponent(String(identifier))}`,
  status: '/admin/discounts/status',
  export: (identifier: string | number) =>
    `/admin/discounts/${encodeURIComponent(String(identifier))}/items/export`,
  template: (identifier: string | number) =>
    `/admin/discounts/${encodeURIComponent(String(identifier))}/items/template`,
  import: (identifier: string | number) =>
    `/admin/discounts/${encodeURIComponent(String(identifier))}/items/import`,
  optionBrands: '/admin/discount-options/brands',
  optionProducts: '/admin/discount-options/products',
  optionVariants: '/admin/discount-options/product-variants',
} as const;

interface ServeWrapper<T> {
  message?: string;
  serve: T;
}

function buildListParams(filters: DiscountListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

function buildOptionParams(filters: DiscountOptionQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.page != null) params.set('page', String(filters.page));
  if (filters.perPage != null) params.set('per_page', String(filters.perPage));
  if (filters.brandId != null) params.set('brand_id', String(filters.brandId));
  if (filters.productId != null) params.set('product_id', String(filters.productId));
  if (filters.ids && filters.ids.length > 0) {
    params.set('ids', filters.ids.join(','));
  }
  if (filters.variantIds && filters.variantIds.length > 0) {
    params.set('variant_ids', filters.variantIds.join(','));
  }
  if (filters.withVariants != null) {
    params.set('with_variants', String(filters.withVariants));
  }
  if (filters.loadAll != null) {
    params.set('load_all', String(filters.loadAll));
  }
  return params;
}

export const discountService = {
  async list(
    filters: DiscountListQuery,
  ): Promise<AdonisPaginatedPayload<Discount>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${DISCOUNT_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeDiscount),
    };
  },

  async getById(identifier: string | number): Promise<Discount> {
    const response = await axiosClient.get<ServeWrapper<unknown>>(
      DISCOUNT_ENDPOINTS.detail(identifier),
    );
    return normalizeDiscount(response.data.serve);
  },

  async create(payload: DiscountFormPayload): Promise<Discount> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      DISCOUNT_ENDPOINTS.list,
      payload,
      { timeout: 120_000 },
    );
    return normalizeDiscount(response.data.serve);
  },

  async update(
    identifier: string | number,
    payload: DiscountFormPayload,
  ): Promise<Discount> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      DISCOUNT_ENDPOINTS.detail(identifier),
      payload,
      { timeout: 120_000 },
    );
    return normalizeDiscount(response.data.serve);
  },

  async updateStatus(payload: DiscountStatusPayload): Promise<void> {
    const body: Record<string, unknown> = {
      id: payload.id,
      is_active: payload.isActive,
      isActive: payload.isActive,
    };
    if (payload.code) body.code = payload.code;
    if (payload.isEcommerce != null) body.is_ecommerce = payload.isEcommerce;
    if (payload.isPos != null) body.is_pos = payload.isPos;
    await axiosClient.put(DISCOUNT_ENDPOINTS.status, body);
  },

  async remove(identifier: string | number): Promise<void> {
    await axiosClient.delete(DISCOUNT_ENDPOINTS.detail(identifier));
  },

  async exportItems(
    identifier: string | number,
    params: DiscountImportParams,
  ): Promise<Blob> {
    const response = await axiosClient.get<Blob>(
      DISCOUNT_ENDPOINTS.export(identifier),
      {
        params: { format: params.format, scope: params.scope },
        responseType: 'blob',
        timeout: 0,
      },
    );
    return response.data;
  },

  async downloadTemplate(
    identifier: string | number,
    params: DiscountImportParams,
  ): Promise<Blob> {
    const response = await axiosClient.get<Blob>(
      DISCOUNT_ENDPOINTS.template(identifier),
      {
        params: { format: params.format, scope: params.scope },
        responseType: 'blob',
        timeout: 0,
      },
    );
    return response.data;
  },

  async importItems(
    identifier: string | number,
    file: File,
    scope: DiscountImportParams['scope'],
    onProgress?: (percent: number) => void,
  ): Promise<ServeWrapper<unknown>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scope', scope);
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      DISCOUNT_ENDPOINTS.import(identifier),
      formData,
      {
        timeout: 0,
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      },
    );
    return response.data;
  },

  async getBrandOptions(
    filters: DiscountOptionQuery = {},
  ): Promise<AdonisPaginatedPayload<DiscountBrandOption>> {
    const params = buildOptionParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${DISCOUNT_ENDPOINTS.optionBrands}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeDiscountBrandOption),
    };
  },

  async getProductOptions(
    filters: DiscountOptionQuery = {},
  ): Promise<AdonisPaginatedPayload<DiscountProductOption>> {
    const params = buildOptionParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${DISCOUNT_ENDPOINTS.optionProducts}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeDiscountProductOption),
    };
  },

  async getVariantOptions(
    filters: DiscountOptionQuery = {},
  ): Promise<AdonisPaginatedPayload<DiscountVariantOption>> {
    const params = buildOptionParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${DISCOUNT_ENDPOINTS.optionVariants}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeDiscountVariantOption),
    };
  },
};
