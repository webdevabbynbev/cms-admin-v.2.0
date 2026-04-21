import { axiosClient } from '@/config/axios';
import type {
  FlashSale,
  FlashSaleFormPayload,
  FlashSaleReorderPayload,
} from '../types';
import { normalizeFlashSale } from '../utils/normalize';

const FLASH_SALE_ENDPOINTS = {
  list: '/admin/flashsales',
  detail: (id: number | string) => `/admin/flashsales/${id}`,
  reorder: '/admin/flashsales/update-order',
} as const;

interface ServeWrapper<T> {
  message?: string;
  serve: T;
}

export const flashSaleService = {
  async list(): Promise<FlashSale[]> {
    const response = await axiosClient.get<ServeWrapper<unknown[]>>(
      FLASH_SALE_ENDPOINTS.list,
    );
    const rows = Array.isArray(response.data.serve) ? response.data.serve : [];
    return rows.map(normalizeFlashSale);
  },

  async getById(id: number | string): Promise<FlashSale> {
    const response = await axiosClient.get<ServeWrapper<unknown>>(
      FLASH_SALE_ENDPOINTS.detail(id),
    );
    return normalizeFlashSale(response.data.serve);
  },

  async create(payload: FlashSaleFormPayload): Promise<FlashSale> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      FLASH_SALE_ENDPOINTS.list,
      payload,
      { timeout: 120_000 },
    );
    return normalizeFlashSale(response.data.serve);
  },

  async update(
    id: number | string,
    payload: FlashSaleFormPayload,
  ): Promise<FlashSale> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      FLASH_SALE_ENDPOINTS.detail(id),
      payload,
      { timeout: 120_000 },
    );
    return normalizeFlashSale(response.data.serve);
  },

  async remove(id: number | string): Promise<void> {
    await axiosClient.delete(FLASH_SALE_ENDPOINTS.detail(id));
  },

  async reorder(payload: FlashSaleReorderPayload): Promise<void> {
    await axiosClient.post(FLASH_SALE_ENDPOINTS.reorder, payload);
  },
};
