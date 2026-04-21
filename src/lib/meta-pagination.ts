import type { AdonisPaginatedPayload } from '@/features/products/types';

/**
 * Some backend endpoints return `{ meta: {...}, data: [...] }` instead of
 * the standard Adonis `{ serve: {...} }` wrapper. This helper unifies them
 * into the `AdonisPaginatedPayload<T>` shape our hooks expect.
 *
 * Known users: `/admin/ramadan-spin-prizes`, `/admin/buy-one-get-one`,
 * `/admin/gift-products`, `/admin/referral-codes`.
 */
export interface MetaPaginatedResponse<T> {
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageUrl?: string;
    lastPageUrl?: string;
    nextPageUrl?: string | null;
    previousPageUrl?: string | null;
  };
  data: T[];
}

export function toPaginated<T>(
  response: MetaPaginatedResponse<T>,
): AdonisPaginatedPayload<T> {
  return {
    data: response.data,
    total: response.meta.total,
    perPage: response.meta.perPage,
    currentPage: response.meta.currentPage,
    lastPage: response.meta.lastPage,
    firstPage: response.meta.firstPage,
  };
}
