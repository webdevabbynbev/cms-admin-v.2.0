import React from "react";
import { message } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import { useSearchParams } from "react-router-dom";
import type { DiscountRecord } from "../../services/api/discount/discount.types";
import {
  getDiscountList,
  updateDiscountStatus,
  deleteDiscount as deleteDiscountApi,
} from "../../api/discount";
import {
  normalizeRow,
  promoStatus,
  resolveIdentifier,
} from "../../utils/discount/table";

export function useTableDiscount() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = React.useState<DiscountRecord[]>([]);

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "all";

  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const warnedMissingIdRef = React.useRef(false);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp: any = await getDiscountList({ q, page, per_page: pageSize });
      const serve = resp?.data?.serve;
      if (serve) {
        const rows = Array.isArray(serve.data) ? serve.data : [];
        const normalizedBase: DiscountRecord[] = rows.map((x: any) =>
          normalizeRow(x as DiscountRecord),
        );
        const currentPageNum = Number(
          serve.currentPage ?? serve.current_page ?? page,
        );
        const normalized: DiscountRecord[] = normalizedBase.map((r, i) => {
          const ident = resolveIdentifier(r);
          return { ...r, __key: ident ?? `tmp-${currentPageNum}-${i}` };
        });
        setData(normalized);
        setTotal(Number(serve.total ?? 0));
        if (
          !warnedMissingIdRef.current &&
          normalized.some((r: DiscountRecord) => !resolveIdentifier(r))
        ) {
          warnedMissingIdRef.current = true;
          message.warning(
            "Identifier diskon tidak tersedia dari API list. Pastikan backend mengirim id atau code.",
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleTableChange = (p: TablePaginationConfig) => {
    setSearchParams((prev) => {
      prev.set("page", String(p.current));
      prev.set("per_page", String(p.pageSize));
      return prev;
    });
  };

  const filteredData = React.useMemo(() => {
    const s = status;
    if (s === "all") return data;
    return data.filter((r) => {
      const st = promoStatus(r).label;
      if (s === "running") return st === "Sedang Berjalan";
      if (s === "upcoming") return st === "Akan Datang";
      if (s === "ended") return st === "Berakhir";
      if (s === "inactive") return st === "Nonaktif";
      return true;
    });
  }, [data, status]);

  const toggleStatus = React.useCallback(
    async (record: DiscountRecord) => {
      const identifier = resolveIdentifier(record);
      if (!identifier) {
        message.error("Identifier diskon tidak tersedia (id/code kosong).");
        return;
      }
      const active = Number(record.isActive) === 1;
      const nextIsActive: 0 | 1 = active ? 0 : 1;
      const idNum = Number(record.id);
      const stableId = Number.isFinite(idNum) && idNum > 0 ? idNum : undefined;
      const stableCode = String(record.code ?? "").trim() || undefined;
      const currentEcommerce = Number(record.isEcommerce) === 1 ? 1 : 0;
      const currentPos = Number(record.isPos) === 1 ? 1 : 0;
      try {
        await updateDiscountStatus(identifier, nextIsActive, {
          id: stableId,
          code: stableCode,
          isEcommerce: nextIsActive === 0 ? 0 : currentEcommerce,
          isPos: nextIsActive === 0 ? 0 : currentPos,
        });
        message.success("Status berhasil diupdate.");
        fetchList();
      } catch {
        message.error("Gagal mengupdate status.");
      }
    },
    [fetchList],
  );

  const deleteDiscount = React.useCallback(
    async (record: DiscountRecord) => {
      const identifier = resolveIdentifier(record);
      if (!identifier) {
        message.error("Identifier diskon tidak tersedia (id/code kosong).");
        return;
      }
      try {
        await deleteDiscountApi(identifier);
        message.success("Promo berhasil dihapus.");
        fetchList();
      } catch {
        message.error("Gagal menghapus promo.");
      }
    },
    [fetchList],
  );

  return {
    data,
    params: { q, status },
    setParams: setSearchParams,
    pagination: { current: page, pageSize, total },
    loading,
    fetchList,
    handleTableChange,
    filteredData,
    toggleStatus,
    deleteDiscount,
  };
}
