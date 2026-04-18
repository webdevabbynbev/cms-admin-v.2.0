import React from "react";
import type { TablePaginationConfig, TableProps } from "antd/es/table";
import { message } from "antd";
import http from "../api/http";
import helper from "../utils/helper";
import type { SaleRecord } from "../components/Forms/Sale/saleTypes";
import { useSearchParams } from "react-router-dom";
import { formatWibDateTime, toWib, wibNow } from "../utils/timezone";

export const BASE_URL = "/admin/sales";

export type SaleItem = {
  __key?: string;
  id?: number | string | null;
  label?: string | null;
  sku?: string | null;
  productId?: number | null;
  productName?: string | null;
  basePrice?: number;
  baseStock?: number;
  salePrice?: number | null;
  promoStock?: number | null;
};

export type ProductGroupRow = {
  key: string;
  productId: number | null;
  productName: string;
  totalVariants: number;
  variants: SaleItem[];
};

export const toIdNum = (id: any) => {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const pick = <T>(r: any, ...keys: string[]): T | undefined => {
  for (const k of keys) {
    const v = r?.[k];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
};

export const toNumSafe = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const isPromoStockInactive = (promoStock: number | null | undefined) =>
  promoStock !== null &&
  promoStock !== undefined &&
  toNumSafe(promoStock, 0) <= 0;

export const isPublished = (r: SaleRecord) => {
  const raw = pick<any>(r, "isPublish", "is_publish", "is_active");
  if (typeof raw === "boolean") return raw;
  return Number(raw ?? 0) === 1;
};

export const promoStatus = (r: SaleRecord) => {
  const published = isPublished(r);
  if (!published) return { label: "Nonaktif", color: "red" as const };

  const now = wibNow();
  const s = r.startDatetime ? toWib(r.startDatetime) : null;
  const e = r.endDatetime ? toWib(r.endDatetime) : null;

  if (s && s.isValid() && now.isBefore(s))
    return { label: "Akan Datang", color: "blue" as const };
  if (e && e.isValid() && now.isAfter(e))
    return { label: "Berakhir", color: "default" as const };

  return { label: "Sedang Berjalan", color: "green" as const };
};

export const formatDateTime = (dt?: string | null) => {
  return formatWibDateTime(dt);
};

export const formatRp = (n: number) =>
  `Rp.${helper.formatRupiah(String(Math.max(0, Math.round(n))))}`;

export const calcPercentOff = (base: number, sale: number) => {
  if (base <= 0) return null;
  const pct = Math.round(((base - sale) / base) * 100);
  return Math.max(0, Math.min(100, pct));
};

export const normalizeItem = (it: any, idx: number): SaleItem => {
  const id =
    pick<any>(
      it,
      "id",
      "productId",
      "product_id",
      "variant_id",
      "product_variant_id",
    ) ?? null;

  const label = String(
    pick<any>(it, "label", "variantLabel", "variant_label") ??
      pick<any>(it?.variant, "label", "variantLabel", "variant_label") ??
      pick<any>(it, "name", "productName", "product_name") ??
      pick<any>(it, "sku") ??
      (id ? `Item ${id}` : "Item"),
  );

  const sku = pick<any>(it, "sku", "masterSku", "master_sku") ?? null;

  const basePrice = toNumSafe(
    pick<any>(it, "price", "basePrice", "base_price") ?? 0,
    0,
  );
  const baseStock = toNumSafe(
    pick<any>(it, "stock", "baseStock", "base_stock") ?? 0,
    0,
  );

  const salePriceRaw =
    it?.pivot?.sale_price ??
    it?.pivot?.salePrice ??
    it?.sale_price ??
    it?.salePrice ??
    it?.pivot_sale_price;
  const salePrice =
    salePriceRaw === undefined || salePriceRaw === null
      ? null
      : toNumSafe(salePriceRaw, 0);

  const promoStockRaw =
    it?.pivot?.stock ?? it?.sale_stock ?? it?.saleStock ?? it?.pivot_stock;
  const promoStock =
    promoStockRaw === undefined || promoStockRaw === null
      ? null
      : toNumSafe(promoStockRaw, 0);

  const productIdRaw =
    pick<any>(it, "productId", "product_id") ??
    pick<any>(it?.product, "id", "product_id");
  const productId = toIdNum(productIdRaw ?? id);
  const productName =
    pick<any>(it, "productName", "product_name") ??
    pick<any>(it?.product, "name", "product_name") ??
    (productId ? `Product ${productId}` : label);

  const key = id ?? productId ?? sku ?? `${idx}`;

  return {
    __key: String(key),
    id,
    label,
    sku: sku ? String(sku) : null,
    productId,
    productName: productName ? String(productName) : null,
    basePrice,
    baseStock,
    salePrice,
    promoStock,
  };
};

export const groupPromoItems = (items: SaleItem[]) => {
  const map = new Map<string, ProductGroupRow>();

  for (const it of items) {
    const pid = toIdNum(it.productId ?? it.id ?? null);
    const key = pid ? `p-${pid}` : `p-${it.__key ?? "unknown"}`;
    const name =
      (it.productName && String(it.productName).trim()) ||
      (it.label && String(it.label).trim()) ||
      (pid ? `Product ${pid}` : "Produk");

    const existing = map.get(key);
    if (existing) {
      existing.variants.push(it);
      existing.totalVariants = existing.variants.length;
      continue;
    }

    map.set(key, {
      key,
      productId: pid,
      productName: name,
      totalVariants: 1,
      variants: [it],
    });
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.productId && b.productId && a.productId !== b.productId) {
      return a.productId - b.productId;
    }
    return String(a.productName).localeCompare(String(b.productName));
  });
};

export const getPromoItems = (r: SaleRecord): SaleItem[] => {
  const items = [...(r.variants ?? []), ...(r.products ?? [])];
  return items.map((it, i) => normalizeItem(it, i));
};

export const countProducts = (r: SaleRecord) => {
  const ids = new Set<number>();

  for (const p of r.products ?? []) {
    const id = toNumSafe(p?.id ?? p?.product_id ?? p?.productId, 0);
    if (id > 0) ids.add(id);
  }

  for (const v of r.variants ?? []) {
    const id = toNumSafe(
      v?.productId ?? v?.product_id ?? v?.product?.id ?? v?.product?.product_id,
      0,
    );
    if (id > 0) ids.add(id);
  }

  return ids.size;
};

const useTableSale = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = React.useState<SaleRecord[]>([]);

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "all";

  const [loading, setLoading] = React.useState(false);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await http.get(BASE_URL);
      const list: SaleRecord[] = resp?.data?.serve ?? [];
      setRows(list);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filteredData = React.useMemo(() => {
    const s = status;
    let list = rows;

    if (s !== "all") {
      list = list.filter((r) => {
        const st = promoStatus(r).label;
        if (s === "running") return st === "Sedang Berjalan";
        if (s === "upcoming") return st === "Akan Datang";
        if (s === "ended") return st === "Berakhir";
        if (s === "inactive") return st === "Nonaktif";
        return true;
      });
    }

    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (r) =>
          (r.title ?? "").toLowerCase().includes(query) ||
          (r.description ?? "").toLowerCase().includes(query),
      );
    }

    return list;
  }, [rows, q, status]);

  // Statistics calculation
  const stats = React.useMemo(() => {
    const total = rows.length;
    const activeInfo = rows.filter(
      (r) => promoStatus(r).label === "Sedang Berjalan",
    ).length;
    const upcoming = rows.filter(
      (r) => promoStatus(r).label === "Akan Datang",
    ).length;
    const ended = rows.filter(
      (r) => promoStatus(r).label === "Berakhir",
    ).length;

    return { total, active: activeInfo, upcoming, ended };
  }, [rows]);

  const tablePagination: TablePaginationConfig = {
    current: page,
    pageSize: pageSize,
    total: filteredData.length,
    showSizeChanger: true,
    showTotal: (totalCount, range) =>
      `${range[0]}-${range[1]} dari ${totalCount} promosi`,
  };

  const handleTableChange: TableProps<SaleRecord>["onChange"] = (p) => {
    setSearchParams((prev) => {
      prev.set("page", String(p.current));
      prev.set("per_page", String(p.pageSize));
      return prev;
    });
  };

  return {
    rows,
    params: { q, status },
    setParams: setSearchParams,
    pagination: { pageSize },
    loading,
    fetchList,
    filteredData,
    stats,
    tablePagination,
    handleTableChange,
  };
};

export default useTableSale;
