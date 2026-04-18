import { useCallback, useEffect, useState } from "react";
import type { TableProps } from "antd/es/table";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getVoucherList } from "../../api/voucher";
import {
  normalizeVoucherEntity,
  type VoucherNormalized,
} from "../../services/api/voucher/voucher.mapper";

export type VoucherRecord = VoucherNormalized;

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: any[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

export const useTableVoucherHooks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<VoucherRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const navigate = useNavigate();

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchText = searchParams.get("q") || "";
  const voucherTypeFilter = searchParams.get("voucher_type") || "all";

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const fetchPerPage = 500;
      let nextPage = 1;
      let allNormalized: VoucherRecord[] = [];
      let expectedTotal = 0;

      while (true) {
        const resp = (await getVoucherList({
          name: searchText,
          page: nextPage,
          per_page: fetchPerPage,
        })) as ListResponse;

        const serve = resp?.data?.serve;
        if (!serve) break;

        const rows = Array.isArray(serve.data) ? serve.data : [];
        const normalizedRows = rows.map(normalizeVoucherEntity);
        allNormalized = [...allNormalized, ...normalizedRows];

        expectedTotal = Number(serve.total ?? expectedTotal ?? 0);
        const currentPage = Number(serve.currentPage ?? nextPage);
        const currentPerPage = Number(serve.perPage ?? fetchPerPage);

        const noMoreRows = rows.length === 0 || rows.length < currentPerPage;
        const reachedTotal =
          expectedTotal > 0 && allNormalized.length >= expectedTotal;
        if (noMoreRows || reachedTotal) break;

        nextPage = currentPage + 1;
      }

      const normalizedFilter = voucherTypeFilter.toLowerCase();
      const filtered = allNormalized.filter((item) => {
        if (normalizedFilter === "all") return true;
        const isProduct =
          Number(item.reward_type ?? 1) === 2 || Number(item.type ?? 0) === 3;
        if (normalizedFilter === "product") return isProduct;
        if (isProduct) return false;
        if (normalizedFilter === "discount") return Number(item.type ?? 0) === 1;
        if (normalizedFilter === "shipping") return Number(item.type ?? 0) === 2;
        return true;
      });

      setData(filtered);
      setTotal(filtered.length);
      if (!expectedTotal && filtered.length === 0) {
        setData([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [searchText, voucherTypeFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page <= totalPages) return;
    setSearchParams((prev) => {
      prev.set("page", String(totalPages));
      return prev;
    });
  }, [total, page, pageSize, setSearchParams]);

  const handleTableChange: TableProps<any>["onChange"] = (p) => {
    setSearchParams((prev) => {
      prev.set("page", String(p.current));
      prev.set("per_page", String(p.pageSize));
      return prev;
    });
  };

  const handleSearch = (val: string) => {
    setSearchParams((prev) => {
      if (val.trim()) prev.set("q", val.trim());
      else prev.delete("q");
      prev.set("page", "1");
      return prev;
    });
  };

  const handlePageSizeChange = (ps: number) => {
    setSearchParams((prev) => {
      prev.set("per_page", String(ps));
      prev.set("page", "1");
      return prev;
    });
  };

  const handleVoucherTypeFilter = (nextType: string) => {
    setSearchParams((prev) => {
      if (!nextType || nextType === "all") {
        prev.delete("voucher_type");
      } else {
        prev.set("voucher_type", nextType);
      }
      prev.set("page", "1");
      return prev;
    });
  };

  return {
    data,
    loading,
    total,
    page,
    pageSize,
    searchText,
    voucherTypeFilter,
    navigate,
    fetchList,
    handleTableChange,
    handleSearch,
    handlePageSizeChange,
    handleVoucherTypeFilter,
  };
};
