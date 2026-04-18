import { useCallback, useEffect, useState } from "react";
import type { TableProps } from "antd/es/table";
import { message } from "antd";
import { useSearchParams } from "react-router-dom";
import type {
  PaginatedResponse,
  ReferralCodeRecord,
} from "../../services/api/referral/referral.types";
import {
  bulkDeleteReferralCodes,
  bulkUpdateReferralCodeStatus,
  deleteReferralCode,
  getReferralCodes,
  type ReferralListParams,
  updateReferralCodeStatus,
} from "../../api/referral";

export const useReferralCodeTable = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<ReferralCodeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchText = searchParams.get("q") || "";
  const status = searchParams.get("status") || "all";

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params: ReferralListParams = {
        page,
        per_page: pageSize,
      };
      if (searchText) params.q = searchText;
      if (status === "active") params.is_active = 1;
      if (status === "inactive") params.is_active = 0;

      const resp = await getReferralCodes(params);
      const serve: PaginatedResponse = resp?.data?.serve ?? resp?.data ?? {};
      const rows = serve?.data ?? [];
      setData(rows);
      setTotal(serve?.meta?.total ?? serve?.total ?? rows.length);
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ?? "Gagal mengambil referral codes",
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText, status]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleTableChange: TableProps<ReferralCodeRecord>["onChange"] = (p) => {
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

  const handleStatusChange = (val: string) => {
    setSearchParams((prev) => {
      prev.set("status", val);
      prev.set("page", "1");
      return prev;
    });
  };

  const toggleStatus = async (
    id: number | string,
    isActive: boolean,
  ): Promise<boolean> => {
    try {
      await updateReferralCodeStatus(id, isActive ? 1 : 0);
      message.success(
        isActive ? "Referral code diaktifkan" : "Referral code dinonaktifkan",
      );
      fetchList();
      return true;
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Gagal update status");
      return false;
    }
  };

  const removeOne = async (id: number | string): Promise<boolean> => {
    try {
      await deleteReferralCode(id);
      message.success("Referral code berhasil dihapus");
      fetchList();
      return true;
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ?? "Gagal menghapus referral code",
      );
      return false;
    }
  };

  const bulkUpdateStatus = async (
    ids: Array<number | string>,
    isActive: 0 | 1,
  ): Promise<boolean> => {
    try {
      await bulkUpdateReferralCodeStatus(ids, isActive);
      message.success(
        isActive === 1
          ? "Referral code berhasil diaktifkan"
          : "Referral code berhasil dinonaktifkan",
      );
      fetchList();
      return true;
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ?? "Gagal update status referral code",
      );
      return false;
    }
  };

  const bulkDelete = async (
    ids: Array<number | string>,
  ): Promise<boolean> => {
    try {
      await bulkDeleteReferralCodes(ids);
      message.success("Referral code berhasil dihapus");
      fetchList();
      return true;
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ?? "Gagal menghapus referral code",
      );
      return false;
    }
  };

  return {
    data,
    loading,
    total,
    page,
    pageSize,
    searchText,
    status,
    fetchList,
    handleTableChange,
    handleSearch,
    handlePageSizeChange,
    handleStatusChange,
    toggleStatus,
    removeOne,
    bulkUpdateStatus,
    bulkDelete,
  };
};
