import { useState, useCallback, useEffect } from "react";
import { message } from "antd";
import http from "../../api/http";
import { useSearchParams } from "react-router-dom";

export interface GiftProductRecord {
  id: number;
  name: string;
  brand_name?: string;
  brand_id?: number;
  product_name?: string;
  variant_name?: string;
  is_sellable?: boolean;
  product_variant_sku?: string;
  price?: number;
  stock?: number;
  giftStock?: number;
  weight?: number;
  image_url?: string;
  description?: string;
  sku?: string;
  quantity?: number;
  is_active: boolean;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

export function useTableGift() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<GiftProductRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const q = searchParams.get("q") || "";

  const [pagination, setPagination] = useState<PaginationState>({
    current: page,
    pageSize: pageSize,
    total: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await http.get(
        `/admin/gift-products?page=${page}&limit=${pageSize}&search=${encodeURIComponent(q)}`,
      );

      
      const responseData = response?.data?.data || response?.data?.serve?.data || response?.data?.serve || [];
      const meta = response?.data?.meta || response?.data?.serve?.meta || {};

      if (Array.isArray(responseData)) {
        const lastPage = meta.lastPage || meta.last_page || 1;
        const currentPage = meta.currentPage || meta.current_page || meta.page || page;

        // If page exceeds lastPage, clamp URL to lastPage and refetch
        if (responseData.length === 0 && page > lastPage && lastPage >= 1) {
          setSearchParams((prev) => {
            prev.set("page", String(lastPage));
            return prev;
          });
          return;
        }

        setData(responseData);
        setPagination({
          current: currentPage,
          pageSize: meta.perPage || meta.per_page || pageSize,
          total: meta.total || responseData.length,
        });
      }
    } catch (error) {
      
      message.error("Failed to load gift products");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteItem = useCallback(
    async (id: number) => {
      try {
        await http.delete(`/admin/gift-products/${id}`);
        message.success("Gift product deleted successfully");
        fetchData();
      } catch (error) {
        
        message.error("Failed to delete gift product");
      }
    },
    [fetchData],
  );

  return {
    data,
    loading,
    pagination,
    fetchData,
    deleteItem,
  };
}
