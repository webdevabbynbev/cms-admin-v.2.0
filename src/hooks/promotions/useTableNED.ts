import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { message } from "antd";
import http from "../../api/http";

/** Record untuk Kampanye NED (dari endpoint /admin/ned) */
export interface NEDProductRecord {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  price?: number;
  quantity?: number;
  is_active: boolean;
  // Visibility fields (backend returns camelCase)
  isVisibleEcommerce?: boolean;
  isVisiblePos?: boolean;
  // snake_case fallback
  is_visible_ecommerce?: boolean;
  is_visible_pos?: boolean;
  created_at?: string;
  updated_at?: string;
  // NED pool product fields (dari endpoint /admin/ned-products)
  namaProduk?: string;
  nama_produk?: string;
  het?: number;
  hpp?: number;
  discountPercent?: number;
  discount_percent?: number;
  stockJual?: number;
  stock_jual?: number;
  stockFreeGift?: number;
  stock_free_gift?: number;
  reservedStockFreeGift?: number;
  varian?: string;
}

export function useTableNED(endpoint: string = "/admin/ned-products") {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const q = searchParams.get("q") || "";

  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${endpoint}?page=${page}&per_page=${pageSize}&q=${encodeURIComponent(q)}`;
      const response = await http.get(url);
      const rawData =
        response?.data?.serve || response?.data?.data || response?.data || {};
      const items = Array.isArray(rawData) ? rawData : rawData.data || [];
      const meta = Array.isArray(rawData) ? {} : rawData;

      setData(items);
      setTotal(meta.total || items.length);
    } catch (error) {
      
      message.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, pageSize, q]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteItem = useCallback(
    async (id: number) => {
      try {
        await http.delete(`${endpoint}/${id}`);
        message.success("Deleted successfully");
        fetchData();
      } catch (error) {
        
        message.error("Failed to delete item");
      }
    },
    [fetchData, endpoint],
  );

  return {
    data,
    loading,
    pagination: { current: page, pageSize, total },
    fetchData,
    deleteItem,
  };
}
