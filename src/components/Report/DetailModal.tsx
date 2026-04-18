import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Modal } from "antd";
import DetailFilters, { type GroupBy } from "./DetailFilters";
import DetailTable from "./DetailTable";
import { dateSorter, numberSorter, stringSorter } from "../../utils/tableSorters";
import Export from "./Export";
import type { CreateReportPayload } from "../../services/api/report.services";

type DetailModalProps = {
  open: boolean;
  detail: any | null;
  loading?: boolean;
  title?: string;
  onClose: () => void;
};

type SalesDetailRow = Record<string, any>;

function getFilterKeyByGroup(row: SalesDetailRow, groupBy: GroupBy): string {
  if (groupBy === "per-brand") return String(row.brand_name || row.brand || "-");
  if (groupBy === "per-variant") return String(row.variant_name || row.variant || "-");
  if (groupBy === "per-category") return String(row.category_name || row.category || "-");
  if (groupBy === "per-concern") return String(row.concern_name || row.concern || "-");
  return String(row.sku || row.name || row.product_name || "-");
}

function resolveDetailRange(row: any): [dayjs.Dayjs, dayjs.Dayjs] | null {
  if (row?.date) {
    const d = dayjs(row.date);
    if (d.isValid()) return [d.startOf("day"), d.endOf("day")];
  }

  if (row?.year && (row?.month || row?.month_number)) {
    const monthNum = Number(row.month ?? row.month_number);
    if (!Number.isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
      const d = dayjs().year(Number(row.year)).month(monthNum - 1);
      return [d.startOf("month"), d.endOf("month")];
    }
  }

  if (row?.month_name) {
    const d = dayjs(row.month_name);
    if (d.isValid()) return [d.startOf("month"), d.endOf("month")];
  }

  if (row?.period) {
    const d = dayjs(row.period);
    if (d.isValid()) return [d.startOf("month"), d.endOf("month")];
  }

  return null;
}

export default function DetailModal({
  open,
  detail,
  loading = false,
  title = "Detail Penjualan",
  onClose,
}: DetailModalProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("per-product");
  const [selectedFilter, setSelectedFilter] = useState<string | undefined>(undefined);
  const detailRange = useMemo(() => resolveDetailRange(detail), [detail]);
  const isMonthlyDetail = useMemo(
    () =>
      Boolean(
        detail?.month_name ||
          (detail?.year && (detail?.month || detail?.month_number)),
      ),
    [detail],
  );

  const dataSource = useMemo<SalesDetailRow[]>(() => {
    if (Array.isArray(detail?.products)) return detail.products;
    if (Array.isArray(detail?.items)) return detail.items;
    return [];
  }, [detail]);

  const groupLabel = useMemo(() => {
    if (groupBy === "per-brand") return "Brand";
    if (groupBy === "per-variant") return "Varian";
    if (groupBy === "per-category") return "Kategori";
    if (groupBy === "per-concern") return "Concern";
    return "Produk";
  }, [groupBy]);

  const filterOptions = useMemo(() => {
    const map = new Map<string, string>();

    for (const row of dataSource) {
      const value = getFilterKeyByGroup(row, groupBy);
      if (!value || value === "-") continue;
      if (groupBy === "per-product") {
        const productName = row.name || row.product_name || "-";
        const sku = row.sku || "";
        const label = sku ? `${productName} (${sku})` : productName;
        if (!map.has(value)) map.set(value, label);
        continue;
      }

      if (!map.has(value)) map.set(value, value);
    }

    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [dataSource, groupBy]);

  const filteredSource = useMemo(() => {
    if (!selectedFilter) return dataSource;
    return dataSource.filter((row) => getFilterKeyByGroup(row, groupBy) === selectedFilter);
  }, [dataSource, selectedFilter, groupBy]);

  const tableData = useMemo(() => {
    const normalize = (r: SalesDetailRow) => {
      const sold = Number(r.total_sold ?? r.qty ?? r.quantity ?? 0);
      const transactions = Number(r.total_transactions ?? 0);
      const discount = Number(r.discount_allocated ?? r.discount ?? 0);
      const revenue = Number(r.total_revenue ?? r.revenue ?? r.sub_total ?? r.grand_total ?? 0);
      const avg =
        r.avg_selling_price != null ? Number(r.avg_selling_price) : sold > 0 ? revenue / sold : 0;
      return {
        date: r.date,
        transaction_date: r.transaction_date,
        created_at: r.created_at,
        period: r.period,
        sku: r.sku || "-",
        name: r.name || r.product_name || "-",
        brand_name: r.brand_name || r.brand || "-",
        total_sold: sold,
        total_transactions: transactions,
        discount_allocated: discount,
        total_revenue: revenue,
        avg_selling_price: avg,
      };
    };

    return filteredSource.map(normalize);
  }, [filteredSource]);

  const baseColumns = [
    {
      title: "No",
      key: "index",
      width: 70,
      align: "center" as const,
      render: (_: any, r: any, index: number) => r?.__rowNumber ?? index + 1,
    },
    ...(isMonthlyDetail
      ? [
          {
            title: "Tanggal",
            dataIndex: "date",
            width: 130,
            sorter: dateSorter<any>("date"),
            render: (v: any, r: any) =>
              v ||
              r.transaction_date ||
              r.created_at ||
              r.period ||
              detail?.month_name ||
              "-",
          },
        ]
      : []),
    {
      title: "SKU",
      dataIndex: "sku",
      width: 130,
      sorter: stringSorter<any>("sku"),
      render: (v: any) => v || "-",
    },
    {
      title: "Produk",
      dataIndex: "name",
      sorter: stringSorter<any>("name"),
      render: (v: any, r: any) => v || r.product_name || "-",
    },
    {
      title: "Brand",
      dataIndex: "brand_name",
      width: 130,
      sorter: stringSorter<any>("brand_name"),
      render: (v: any, r: any) => v || r.brand || "-",
    },
    {
      title: "Terjual",
      dataIndex: "total_sold",
      align: "right" as const,
      sorter: numberSorter<any>("total_sold"),
      render: (v: any, r: any) =>
        new Intl.NumberFormat("id-ID").format(Number(v ?? r.qty ?? r.quantity ?? 0)),
    },
    {
      title: "Total Transaksi",
      dataIndex: "total_transactions",
      align: "right" as const,
      sorter: numberSorter<any>("total_transactions"),
      render: (v: any) => new Intl.NumberFormat("id-ID").format(Number(v ?? 0)),
    },
    {
      title: "Diskon (Proporsional)",
      dataIndex: "discount_allocated",
      align: "right" as const,
      sorter: numberSorter<any>("discount_allocated"),
      render: (v: any, r: any) => new Intl.NumberFormat("id-ID").format(Number(v ?? r.discount ?? 0)),
    },
    {
      title: "Pendapatan Bersih",
      dataIndex: "total_revenue",
      align: "right" as const,
      sorter: numberSorter<any>("total_revenue"),
      render: (v: any, r: any) =>
        new Intl.NumberFormat("id-ID").format(
          Number(v ?? r.revenue ?? r.sub_total ?? r.grand_total ?? 0),
        ),
    },
    {
      title: "Avg. Harga Jual",
      dataIndex: "avg_selling_price",
      align: "right" as const,
      sorter: numberSorter<any>("avg_selling_price"),
      render: (v: any, r: any) => {
        if (v !== undefined && v !== null) {
          return new Intl.NumberFormat("id-ID").format(Number(v));
        }
        const sold = Number(r.total_sold ?? r.qty ?? r.quantity ?? 0);
        const revenue = Number(r.total_revenue ?? r.revenue ?? r.sub_total ?? 0);
        const avg = sold > 0 ? revenue / sold : 0;
        return new Intl.NumberFormat("id-ID").format(avg);
      },
    },
  ];
  const columns = baseColumns;

  return (
    <Modal title={title} open={open} onCancel={onClose} footer={null} width="80vw">
      <div className="h-[70vh] overflow-y-auto">
        <div className="mb-3 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <DetailFilters
            groupBy={groupBy}
            selectedFilter={selectedFilter}
            groupLabel={groupLabel}
            filterOptions={filterOptions}
            onGroupByChange={(value) => {
              setGroupBy(value);
              setSelectedFilter(undefined);
            }}
            onSelectedFilterChange={(value) => setSelectedFilter(value)}
          />
          <Export
            buttonText="Export"
            formats={["excel", "csv"]}
            disabled={loading || !detailRange}
            buildRequest={(format): CreateReportPayload => ({
              title,
              report_type: "product" as any,
              report_period: "custom",
              report_format: format,
              start_date: (detailRange?.[0] ?? dayjs().startOf("month")).toISOString(),
              end_date: (detailRange?.[1] ?? dayjs().endOf("month")).toISOString(),
              channel: "all" as any,
            })}
            getDownloadFileName={(format) => {
              const safeTitle = String(title || "detail-penjualan")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
              return `${safeTitle}.${format === "excel" ? "xlsx" : "csv"}`;
            }}
          />
        </div>
        <DetailTable
          dataSource={tableData}
          loading={loading}
          columns={columns}
        />
      </div>
    </Modal>
  );
}
