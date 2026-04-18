import React from "react";
import type { TablePaginationConfig, TableProps } from "antd/es/table";
import { message } from "antd";
import { useSearchParams } from "react-router-dom";
import type { FlashSaleRow } from "../../services/api/flash-sale/flashsale.types";
import { getFlashSales } from "../../api/flash-sale";
import { promoStatus } from "../../utils/flash-sale/table";

const useTableFlashSale = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = React.useState<FlashSaleRow[]>([]);

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "all";

  const [loading, setLoading] = React.useState(false);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getFlashSales();
      const list: FlashSaleRow[] =
        resp?.data?.serve?.data ?? resp?.data?.serve ?? [];
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
      `${range[0]}-${range[1]} dari ${totalCount} flash sale`,
  };

  const handleTableChange: TableProps<FlashSaleRow>["onChange"] = (p) => {
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

export default useTableFlashSale;
