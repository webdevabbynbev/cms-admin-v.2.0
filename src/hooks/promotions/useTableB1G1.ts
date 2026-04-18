import { useState, useCallback } from "react";
import { message } from "antd";
import http from "../../api/http";
import { useSearchParams } from "react-router-dom";

export interface B1G1PromoRecord {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  isEcommerce: boolean;
  isPos: boolean;
  usageLimit?: number;
  usageCount?: number;
  reservedCount?: number;
  minimumPurchase?: number;
  applyTo?: string;
  brandId?: number;
  startedAt: string;
  expiredAt?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: any[];
}

export function useTableB1G1() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<B1G1PromoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const q = searchParams.get("q") || "";

  const fetchData = useCallback(
    async (p = page, ps = pageSize, search = q) => {
      try {
        setLoading(true);
        const response = await http.get(
          `/admin/buy-one-get-one?page=${p}&limit=${ps}&q=${encodeURIComponent(search)}`,
        );

        const body = response?.data;

        if (body?.meta && Array.isArray(body?.data)) {
          setData(body.data);
          setTotal(body.meta.total || body.data.length);
        } else if (body?.serve && typeof body.serve === "object") {
          const items = Array.isArray(body.serve)
            ? body.serve
            : body.serve.data || [];
          setData(items);
          setTotal(body.serve.total || items.length);
        } else if (Array.isArray(body)) {
          setData(body);
          setTotal(body.length);
        } else {
          setData([]);
          setTotal(0);
        }
      } catch (error) {
        
        message.error("Gagal memuat data promo B1G1");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, q],
  );

  const deleteItem = useCallback(
    async (id: number) => {
      try {
        await http.delete(`/admin/buy-one-get-one/${id}`);
        message.success("Promo B1G1 berhasil dihapus");
        await fetchData();
      } catch (error) {
        
        message.error("Gagal menghapus promo B1G1");
      }
    },
    [fetchData],
  );

  return {
    data,
    loading,
    total,
    fetchData,
    deleteItem,
  };
}
