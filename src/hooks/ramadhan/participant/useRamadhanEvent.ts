// useRamadanEvent.ts
import { useState, useEffect } from "react";
import { message } from "antd";
import http from "../../../api/http";
import type {
  RamadanParticipantRecord,
  PrizeSelection,
  StatsType,
} from "../../../components/Tables/Ramadhan/Participant/ramadhanTypes";
import { useSearchParams } from "react-router-dom";
import React from "react";

import { wibNow } from "../../../utils/timezone";

type QueryParams = {
  name?: string;
  min_checkin?: number;
  has_prize?: number | null;
};

export const useRamadanEvent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [prizes, setPrizes] = useState<any[]>([]);
  const [selectedMilestones, setSelectedMilestones] = useState<{
    [k: number]: number | null;
  }>({ 7: null, 15: null, 30: null });

  const [data, setData] = useState<RamadanParticipantRecord[]>([]);

  // Derived from URL
  const perPageParam = searchParams.get("per_page");
  const isAll = perPageParam === "all";
  const page = isAll ? 1 : Number(searchParams.get("page")) || 1;
  const pageSize = isAll ? 10 : Number(perPageParam) || 10;
  const searchName = searchParams.get("q") || "";
  const minCheckin = searchParams.get("min_checkin") || "";
  const hasPrizeParam = searchParams.get("has_prize");
  const hasPrize = hasPrizeParam !== null ? Number(hasPrizeParam) : null;

  const [open, setOpen] = useState<boolean>(false);
  const [current, setCurrent] = useState<RamadanParticipantRecord | false>(
    false,
  );
  const [prizeModalOpen, setPrizeModalOpen] = useState<boolean>(false);
  const [prizeSelection, setPrizeSelection] = useState<PrizeSelection>({
    7: null,
    15: null,
    30: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<StatsType>({
    totalParticipants: 0,
    totalWith7Days: 0,
    totalWith15Days: 0,
    totalWith30Days: 0,
  });

  const fetchPrizes = async () => {
    try {
      const resp: any = await http.get(`/admin/ramadan-spin-prizes`);
      const serve = resp?.data?.serve;
      let list: any[] = [];
      if (serve) {
        if (Array.isArray(serve.data)) list = serve.data;
        else if (typeof serve.data === "object" && serve.data !== null)
          list = Object.values(serve.data);
      }
      setPrizes(list);
      const mapping: { [k: number]: number | null } = {
        7: null,
        15: null,
        30: null,
      };
      list.forEach((p: any) => {
        const md = p.milestoneDay ?? p.milestone_day;
        if (md) mapping[Number(md)] = p.id;
      });
      setSelectedMilestones(mapping);
    } catch (err) {
      
      message.error("Gagal memuat data hadiah");
    }
  };

  const buildListUrl = (q: QueryParams, p?: number, pp?: number | string) => {
    let url = `/admin/ramadan-participants?page=${p ?? page}&per_page=${
      pp ?? pageSize
    }&q=${encodeURIComponent(q.name ?? "")}`;
    if (q.min_checkin) url += `&min_checkin=${q.min_checkin}`;
    if (q.has_prize !== undefined && q.has_prize !== null)
      url += `&has_prize=${q.has_prize}`;
    return url;
  };

  const normalizeListData = (serve: any): RamadanParticipantRecord[] => {
    if (!serve) return [];
    if (Array.isArray(serve.data)) return serve.data;
    if (typeof serve.data === "object" && serve.data !== null)
      return Object.values(serve.data);
    return [];
  };

  const getTotalCheckin = (rec: RamadanParticipantRecord) => {
    const direct = (rec as any).totalCheckin;
    if (direct !== undefined && direct !== null) return Number(direct) || 0;
    const fasting = Number(rec.totalFasting || 0);
    const notFasting = Number(rec.totalNotFasting || 0);
    return fasting + notFasting;
  };

  const applyMinCheckinFilter = (
    rows: RamadanParticipantRecord[],
    min?: number | null,
  ) => {
    if (!min) return rows;
    const minNum = Number(min);
    if (!Number.isFinite(minNum) || minNum <= 0) return rows;
    return rows.filter((r) => getTotalCheckin(r) >= minNum);
  };

  const fetchAllRows = async (q: QueryParams) => {
    const ps = 500;
    let curPage = 1;
    let rows: RamadanParticipantRecord[] = [];

    for (;;) {
      const url = buildListUrl(q, curPage, ps);
      const resp: any = await http.get(url);
      const serve = resp?.data?.serve;
      if (!serve) break;

      const list = normalizeListData(serve);
      rows = rows.concat(list);

      const t = Number(serve.total ?? rows.length);
      const per = Number(serve.perPage ?? ps);
      const cur = Number(serve.currentPage ?? curPage);

      if (!per || list.length === 0) break;
      if (rows.length >= t) break;

      curPage = cur + 1;
    }

    return rows;
  };

  const fetchTotalAll = async () => {
    try {
      const rows = await fetchAllRows({});
      setTotalAll(rows.length);
    } catch (err) {
      
      setTotalAll(0);
    }
  };

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const q: QueryParams = {
        name: searchName,
        min_checkin: minCheckin ? Number(minCheckin) : undefined,
        has_prize: hasPrize !== null ? Number(hasPrize) : null,
      };

      const url = buildListUrl(q, page, isAll ? "all" : pageSize);
      const resp: any = await http.get(url);
      const serve = resp?.data?.serve;
      if (serve) {
        const tableData = normalizeListData(serve);
        setData(tableData);
        setTotal(Number(serve.total));

        if (serve?.stats) {
          setStats({
            totalParticipants: Number(
              serve.stats?.totalParticipants ?? serve.total ?? 0,
            ),
            totalWith7Days: Number(serve.stats?.totalWith7Days ?? 0),
            totalWith15Days: Number(serve.stats?.totalWith15Days ?? 0),
            totalWith30Days: Number(serve.stats?.totalWith30Days ?? 0),
          });
        } else {
          // Fallback (page-only)
          const stats7 = tableData.filter(
            (p) => getTotalCheckin(p) >= 7,
          ).length;
          const stats15 = tableData.filter(
            (p) => getTotalCheckin(p) >= 15,
          ).length;
          const stats30 = tableData.filter(
            (p) => getTotalCheckin(p) >= 30,
          ).length;

          setStats({
            totalParticipants: Number(serve.total),
            totalWith7Days: stats7,
            totalWith15Days: stats15,
            totalWith30Days: stats30,
          });
        }
      } else {
        setData([]);
        setTotal(0);
      }
    } catch (err) {
      
      message.error("Gagal memuat data peserta");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, isAll, searchName, minCheckin, hasPrize]);

  const exportCsv = async () => {
    const exportKey = "ramadan-export";
    setExportLoading(true);
    try {
      message.loading({
        content: "Menyiapkan export CSV...",
        key: exportKey,
        duration: 0,
      });

      // Export participants with current filters
      const q: QueryParams = {
        name: searchName,
        min_checkin: minCheckin ? Number(minCheckin) : undefined,
        has_prize: hasPrize !== null ? Number(hasPrize) : null,
      };
      const rows = await fetchAllRows(q);
      const filteredRows = applyMinCheckinFilter(rows, q.min_checkin);

      const headers = [
        "User ID",
        "Nama Peserta",
        "Email",
        "No HP",
        "Alamat",
        "Total Check-in",
        "Hari Puasa",
        "Tidak Puasa",
        "Prize 7",
        "Prize 15",
        "Prize 30",
      ];

      const toCount = (v: unknown) =>
        Number.isFinite(Number(v)) ? Number(v) : 0;

      const escapeCsv = (val: unknown) =>
        `"${String(val ?? "").replace(/"/g, '""')}"`;

      const csvLines = [
        headers.join(","),
        ...filteredRows.map((r) => {
          const totalCheckin = getTotalCheckin(r);
          const prize7 = (r as any).prize_7 ?? (r as any).prize7 ?? "";
          const prize15 = (r as any).prize_15 ?? (r as any).prize15 ?? "";
          const prize30 = (r as any).prize_30 ?? (r as any).prize30 ?? "";
          const values = [
            r.id ?? "",
            r.name ?? "",
            (r as any).email ?? "",
            r.phone_number ?? "",
            (r as any).address ?? "",
            totalCheckin,
            toCount(r.totalFasting),
            toCount(r.totalNotFasting),
            prize7,
            prize15,
            prize30,
          ];
          return values.map(escapeCsv).join(",");
        }),
      ];

      const csvContent = csvLines.join("\n");
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `ramadan_event_${wibNow().format("YYYY-MM-DD")}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success({ content: "CSV berhasil diunduh", key: exportKey });
    } catch (err: any) {
      message.error({
        content: err?.response?.data?.message || "Gagal mengekspor CSV",
        key: exportKey,
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleSavePrize = async () => {
    if (!current) return;
    try {
      setLoading(true);
      const payload = {
        prize_7: prizeSelection[7],
        prize_15: prizeSelection[15],
        prize_30: prizeSelection[30],
      };
      const resp: any = await http.post(
        `/admin/ramadan-participants/${current.id}/assign-prize`,
        payload,
      );
      const updatedPrize = resp?.data?.data || {};
      const nextPrize7 =
        updatedPrize.prize_7 ?? updatedPrize.prize7 ?? payload.prize_7 ?? null;
      const nextPrize15 =
        updatedPrize.prize_15 ??
        updatedPrize.prize15 ??
        payload.prize_15 ??
        null;
      const nextPrize30 =
        updatedPrize.prize_30 ??
        updatedPrize.prize30 ??
        payload.prize_30 ??
        null;

      const patchRow = (row: RamadanParticipantRecord) => {
        if (String(row.id) !== String(current.id)) return row;
        return {
          ...row,
          prize_7: nextPrize7,
          prize_15: nextPrize15,
          prize_30: nextPrize30,
        } as RamadanParticipantRecord;
      };

      setData((prev) => prev.map(patchRow));
      message.success("✅ Hadiah berhasil disimpan!");
      setPrizeModalOpen(false);
      fetchList();
      fetchPrizes();
    } catch (err: any) {
      message.error(err?.message || "❌ Gagal menyimpan hadiah");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    fetchPrizes();
  }, [fetchList]);

  useEffect(() => {
    fetchTotalAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    prizes,
    selectedMilestones,
    data,
    searchParams,
    setSearchParams,
    page,
    pageSize,
    isAll,
    total,
    totalAll,
    open,
    setOpen,
    current,
    setCurrent,
    prizeModalOpen,
    setPrizeModalOpen,
    prizeSelection,
    setPrizeSelection,
    loading,
    exportLoading,
    stats,
    fetchList,
    exportCsv,
    fetchPrizes,
    handleSavePrize,
  };
};
