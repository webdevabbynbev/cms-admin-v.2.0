import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Drawer,
  Dropdown,
  Input,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  DownOutlined,
  DownloadOutlined,
  FilterOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import useDebounce from "../../../hooks/useDebounce";
import dayjs from "dayjs";
import { useReactToPrint } from "react-to-print";
import { createAndWaitReport } from "../_shared/reportRunner";
import {
  type CreateReportPayload,
  type ReportEntity,
  downloadReport,
} from "../../../services/api/report.services";
import DateRangeFilter, {
  type DateRangeFilterValue,
} from "../../../components/Report/DateRangeFilter";
import TablePagination from "../../../components/Tables/Pagination/TablePagination";
import {
  getTransactionStatusMeta,
  STATUS_FILTER_OPTIONS,
} from "../../../components/Transaction/transactionUtils";
import {
  getGiftAwareBrandName,
  getGiftAwareProductName,
  isGiftLikeItem,
} from "../../../utils/b1g1GiftUtils";
import api from "../../../api/http";
import { pdf } from "@react-pdf/renderer";
import OrderManagementModal from "../../../components/Transaction/OrderManagementModal";
import InvoicePdf from "../../../components/Transaction/InvoicePdf";
import type { Tx } from "../../../components/Transaction/transactionUtils";

const { Text, Title } = Typography;

const fmtIDR = (n: any) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    Number(n || 0),
  );

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  ...STATUS_FILTER_OPTIONS.map(({ value, label }) => ({ value, label })),
];

const PRODUCT_VIEW_OPTIONS = [
  { value: "all", label: "All" },
  { value: "gift", label: "Produk Gift" },
  { value: "sale", label: "Produk Jual" },
] as const;

const DIMENSION_OPTIONS = [
  { value: "customer", label: "Customer" },
  { value: "master_sku", label: "SKU" },
  { value: "variant_label", label: "Variant" },
  { value: "channel", label: "Channel" },
] as const;

type DimensionKey = (typeof DIMENSION_OPTIONS)[number]["value"];

const jsonInFlightKeys = new Set<string>();

function ActiveFilterChips({
  status,
  productView,
  brandFilter,
  activeCount,
  onRemoveStatus,
  onRemoveProductView,
  onRemoveBrand,
  onResetAll,
}: {
  status: string;
  productView: string;
  brandFilter: string;
  activeCount: number;
  onRemoveStatus: () => void;
  onRemoveProductView: () => void;
  onRemoveBrand: () => void;
  onResetAll: () => void;
}) {
  const chips: { key: string; label: string; onClose: () => void }[] = [];

  if (status !== "all") {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    chips.push({
      key: "status",
      label: `Status: ${opt?.label ?? status}`,
      onClose: onRemoveStatus,
    });
  }
  if (productView !== "all") {
    const opt = PRODUCT_VIEW_OPTIONS.find((o) => o.value === productView);
    chips.push({
      key: "productView",
      label: `Produk: ${opt?.label ?? productView}`,
      onClose: onRemoveProductView,
    });
  }
  if (brandFilter !== "all") {
    chips.push({
      key: "brand",
      label: `Brand: ${brandFilter}`,
      onClose: onRemoveBrand,
    });
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 8,
      }}
    >
      <Text type="secondary" style={{ fontSize: 12 }}>
        {activeCount} filter aktif:
      </Text>
      {chips.map((chip) => (
        <Tag
          key={chip.key}
          closable
          onClose={chip.onClose}
          color="blue"
          style={{ margin: 0, fontWeight: 500 }}
        >
          {chip.label}
        </Tag>
      ))}
      <Button
        type="link"
        size="small"
        style={{ padding: 0, height: "auto", fontSize: 12 }}
        onClick={onResetAll}
      >
        Reset semua
      </Button>
    </div>
  );
}

export default function TransactionReportPage() {
  const pageTitle = "Laporan Transaksi";

  const [filter, setFilter] = useState<DateRangeFilterValue>(() => {
    const now = dayjs();
    return { preset: "today", range: [now.startOf("day"), now.endOf("day")] };
  });
  const [status, setStatus] = useState<string>("all");
  const [productView, setProductView] = useState<"all" | "gift" | "sale">("all");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportEntity | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  // Draft values — only committed to state when user clicks "Terapkan Filter"
  const [draftStatus, setDraftStatus] = useState<string>("all");
  const [draftProductView, setDraftProductView] = useState<"all" | "gift" | "sale">("all");
  const [draftBrandFilter, setDraftBrandFilter] = useState<string>("all");
  const [dimensions, setDimensions] = useState<DimensionKey[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    order: "ascend" | "descend";
  } | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  // Modal state
  const [managementModalVisible, setManagementModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Only data filters count toward the badge (dimensions are column visibility, not filters)
  const activeCount = [
    status !== "all",
    productView !== "all",
    brandFilter !== "all",
  ].filter(Boolean).length;

  // How many filters are staged in the drawer (not yet applied)
  const draftActiveCount = [
    draftStatus !== "all",
    draftProductView !== "all",
    draftBrandFilter !== "all",
  ].filter(Boolean).length;

  // Sync draft values to current applied values whenever the drawer opens
  useEffect(() => {
    if (filterDrawerOpen) {
      setDraftStatus(status);
      setDraftProductView(productView);
      setDraftBrandFilter(brandFilter);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDrawerOpen]);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: pageTitle,
  });

  // ─── Modal helpers ───────────────────────────────────────────────────────────

  const fetchTracking = useCallback(async (id: number) => {
    setTrackingLoading(true);
    try {
      const { data } = await api.get(`/admin/transactions/${id}/tracking`);
      setTrackingData(data?.serve);
    } catch {
      setTrackingData(null);
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (managementModalVisible && selectedTx) {
      const sh = selectedTx.shipments?.[0];
      const resi = sh?.resiNumber || (sh as any)?.resi_number;
      if (resi) {
        fetchTracking(selectedTx.id);
      } else {
        setTrackingData(null);
      }
    } else {
      setTrackingData(null);
    }
  }, [managementModalVisible, selectedTx, fetchTracking]);

  const showManagementModal = async (transactionId: number) => {
    try {
      setModalLoading(true);
      const { data } = await api.get(`/admin/transactions/${transactionId}`);
      const tx = data?.serve;
      if (!tx) throw new Error("Detail transaksi kosong");
      setSelectedTx(tx);
      setManagementModalVisible(true);
    } catch (e: any) {
      message.error(e?.response?.data?.message || e.message || "Gagal ambil detail");
    } finally {
      setModalLoading(false);
    }
  };

  const getBase64Logo = async (): Promise<string | null> => {
    try {
      const response = await fetch("/logoAbbyCombine.svg");
      const svgText = await response.text();
      return await new Promise<string>((resolve, reject) => {
        const img = new window.Image();
        const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || 348;
          canvas.height = img.naturalHeight || 154;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to load SVG"));
        };
        img.src = url;
      });
    } catch {
      return null;
    }
  };

  const downloadInvoice = async (transactionId: number, mode: "download" | "print") => {
    setModalLoading(true);
    try {
      let tx: any = null;
      if (selectedTx && selectedTx.id === transactionId) {
        tx = selectedTx;
      } else {
        const { data } = await api.get(`/admin/transactions/${transactionId}`);
        tx = data?.serve;
      }
      if (!tx) throw new Error("Detail transaksi kosong");

      const logoSrc = await getBase64Logo();
      const filename = `Invoice_${dayjs().format("DDMMYYYY_HHmm")}.pdf`;
      const blob = await pdf(
        <InvoicePdf tx={tx} logoSrc={logoSrc || undefined} title={filename.replace(".pdf", "")} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      if (mode === "download") {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
      } else {
        const w = window.open(url);
        if (w) w.document.title = filename;
        setTimeout(() => w?.print(), 500);
      }
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e: any) {
      message.error(e?.response?.data?.message || e.message || "Gagal buat/download invoice");
    } finally {
      setModalLoading(false);
    }
  };

  const run = async (
    currentFilter: DateRangeFilterValue = filter,
    currentStatus?: string,
  ) => {
    const effectiveStatus =
      currentStatus && currentStatus !== "all" ? currentStatus : undefined;

    const runKey = [
      "transaction",
      "daily",
      currentFilter.preset,
      currentFilter.range[0].toISOString(),
      currentFilter.range[1].toISOString(),
      effectiveStatus ?? "all-status",
    ].join("|");

    if (jsonInFlightKeys.has(runKey)) return;
    jsonInFlightKeys.add(runKey);

    setLoading(true);
    try {
      const r = await createAndWaitReport({
        title: pageTitle,
        report_type: "transaction",
        report_period: "daily",
        report_format: "json",
        start_date: currentFilter.range[0].toISOString(),
        end_date: currentFilter.range[1].toISOString(),
        channel: "all",
        filters: effectiveStatus ? { status: effectiveStatus } : {},
      });
      setReport(r);
    } catch (e: any) {
      message.error(e?.message || "Gagal generate laporan");
    } finally {
      jsonInFlightKeys.delete(runKey);
      setLoading(false);
    }
  };

  const buildExportRequest = (format: "excel" | "csv"): CreateReportPayload => {
    const periodFrom = filter.range[0].format("YYYY-MM-DD");
    const periodTo = filter.range[1].format("YYYY-MM-DD");
    const periodLabel = periodFrom === periodTo ? periodFrom : `${periodFrom} to ${periodTo}`;
    return {
      title: pageTitle,
      report_type: "transaction",
      report_period: "custom",
      report_format: format,
      start_date: filter.range[0].toISOString(),
      end_date: filter.range[1].toISOString(),
      channel: "all",
      filters: {
        ...(status && status !== "all" ? { status } : {}),
        ...(dimensions.length > 0 ? { dimensions } : {}),
        // Pass client-side filters so server can mirror the current view
        ...(productView !== "all" ? { product_view: productView } : {}),
        ...(brandFilter !== "all" ? { brand_filter: brandFilter } : {}),
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(sortConfig
          ? { sort_field: sortConfig.field, sort_order: sortConfig.order }
          : {}),
        period: periodLabel,
      },
    };
  };

  const getExportFileName = (format: "excel" | "csv") =>
    `${pageTitle}-${dayjs().format("YYYYMMDD")}.${format === "excel" ? "xlsx" : "csv"}`;

  // ─── Data ───────────────────────────────────────────────────────────────────

  const data = report?.data || {};

  const rows = useMemo(
    () =>
      Array.isArray(data.transactions)
        ? data.transactions.flatMap((t: any, tIdx: number) =>
            (t.items || []).map((item: any, iIdx: number) => {
              const itemPrice = Number(item?.price ?? 0);
              const itemSubTotal = Number(
                item?.sub_total ?? item?.subtotal ?? item?.amount ?? 0,
              );
              const isGiftItem = isGiftLikeItem(item);
              const displayProductName = getGiftAwareProductName(item);
              const brandName = getGiftAwareBrandName(item);

              const txShippingCost = Number(
                t.ecommerce?.shipping_cost ?? t.shippingCost ?? t.shipping_cost ?? t.ecommerce?.shippingCost ?? t.shipments?.[0]?.price ?? 0,
              );
              const txTotalDiscount = Number(t.discount ?? t.discountTotal ?? t.discountAmount ?? 0);
              const txDiskonProduk = (t.items || []).filter((d: any) => Number(d.price) > 0).reduce((acc: number, d: any) => acc + Number(d.discount || 0), 0);
              const txRemainingDiscount = Math.max(0, txTotalDiscount - txDiskonProduk);
              const txDiskonVoucherOngkir = Math.min(txRemainingDiscount, Math.min(txShippingCost, 10000));

              return {
                __key: `${t.id ?? tIdx}-${iIdx}`,
                transaction_id: t.id ?? null,
                date: t.date,
                transaction_number: t.transaction_number,
                status: String(t.status ?? ""),
                failure_source: t.failure_source ?? null,
                status_label: getTransactionStatusMeta({
                  transactionStatus: String(t.status ?? ""),
                  transactionStatusLabel: t.status_label,
                  failureSource: t.failure_source,
                }).text,
                channel: t.channel,
                customer_name: t.customer?.name || "-",
                is_gift_item: isGiftItem,
                product_name: displayProductName,
                brand: brandName,
                qty: item.qty ?? item.quantity ?? 0,
                base_price: Number(item.base_price ?? item.basePrice ?? 0),
                price: itemPrice,
                shipping_cost: txShippingCost,
                discount_product: Number(item.discount ?? item.discount_product ?? 0),
                discount_shipping: txDiskonVoucherOngkir,
                shipping_paid: Math.max(0, txShippingCost - txDiskonVoucherOngkir),
                sub_total: itemSubTotal,
                master_sku: item.master_sku || "-",
                variant_label: item.variant_label || "-",
              };
            }),
          )
        : [],
    [data.transactions],
  );

  const brandOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [
      { value: "all", label: "Semua Brand" },
    ];
    for (const row of rows) {
      const b = row.brand;
      if (b && b !== "-" && !seen.has(b)) {
        seen.add(b);
        options.push({ value: b, label: b });
      }
    }
    return options;
  }, [rows]);

  const filteredRows = useMemo(() => {
    let result: typeof rows = rows;

    if (productView === "gift") result = result.filter((r: any) => r.is_gift_item);
    else if (productView === "sale") result = result.filter((r: any) => !r.is_gift_item);

    if (brandFilter && brandFilter !== "all") {
      result = result.filter((r: any) => r.brand === brandFilter);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      const matchedTxKeys = new Set<string>();
      for (const r of result as any[]) {
        if (String(r.transaction_number || "").toLowerCase().includes(q)) {
          matchedTxKeys.add(String(r.transaction_id ?? r.transaction_number ?? r.__key));
        }
      }
      result = result.filter((r: any) =>
        matchedTxKeys.has(String(r.transaction_id ?? r.transaction_number ?? r.__key)),
      );
    }

    return result;
  }, [rows, productView, brandFilter, debouncedSearch]);

  // Fix #7: single-pass memo — group + assign rowSpan metadata in one iteration
  const transactionGroups = useMemo(() => {
    type BaseRow = (typeof filteredRows)[number];
    type RowWithMeta = BaseRow & {
      __transaction_group_key: string;
      __transaction_row_span: number;
    };
    const groups: RowWithMeta[][] = [];
    let i = 0;
    while (i < filteredRows.length) {
      const key = String(
        filteredRows[i].transaction_id ??
        filteredRows[i].transaction_number ??
        filteredRows[i].__key,
      );
      const groupRaw: BaseRow[] = [];
      while (i < filteredRows.length) {
        const rKey = String(
          filteredRows[i].transaction_id ??
          filteredRows[i].transaction_number ??
          filteredRows[i].__key,
        );
        if (rKey !== key) break;
        groupRaw.push(filteredRows[i]);
        i++;
      }
      const span = groupRaw.length;
      groups.push(
        groupRaw.map((row: BaseRow, idx: number) => ({
          ...row,
          __transaction_group_key: key,
          __transaction_row_span: idx === 0 ? span : 0,
        })),
      );
    }
    return groups;
  }, [filteredRows]);

  const sortedGroups = useMemo(() => {
    if (!sortConfig) return transactionGroups;
    const { field, order } = sortConfig;
    const dir = order === "ascend" ? 1 : -1;
    return [...transactionGroups].sort((a, b) => {
      const aVal = a[0]?.[field as keyof (typeof a)[0]] ?? "";
      const bVal = b[0]?.[field as keyof (typeof b)[0]] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * dir;
      }
      return String(aVal).localeCompare(String(bVal), "id") * dir;
    });
  }, [transactionGroups, sortConfig]);

  const total = sortedGroups.length;

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedGroups.slice(start, end).flat();
  }, [sortedGroups, page, pageSize]);

  const summary = useMemo(() => {
    const transactionNumbers = new Set<string>();
    let totalAmount = 0;
    let totalDiscount = 0;

    for (const row of filteredRows) {
      transactionNumbers.add(
        String(row.transaction_number || row.transaction_id || row.__key),
      );
      totalAmount += Number(row.sub_total || 0);
      totalDiscount += Number(row.discount || 0);
    }

    const totalTransactions = transactionNumbers.size;
    return {
      total_transactions: totalTransactions,
      total_amount: totalAmount,
      total_discount: totalDiscount,
      avg_transaction_value:
        totalTransactions > 0 ? totalAmount / totalTransactions : 0,
    };
  }, [filteredRows]);

  const columns = useMemo(() => {
    const sf = (field: string) => ({
      key: field,
      sorter: true as const,
      sortOrder: (sortConfig?.field === field ? sortConfig.order : null) as
        | "ascend"
        | "descend"
        | null,
    });
    return [
      {
        title: "No. Transaksi",
        dataIndex: "transaction_number",
        ...sf("transaction_number"),
        fixed: "left" as const,
        render: (v: any, r: any) => ({
          children: r.transaction_id ? (
            <Typography.Link
              onClick={() => showManagementModal(r.transaction_id)}
              style={{ fontWeight: 600 }}
            >
              {v || "-"}
            </Typography.Link>
          ) : (
            v || "-"
          ),
          props: { rowSpan: r.__transaction_row_span ?? 1 },
        }),
      },
      {
        title: "Tanggal",
        dataIndex: "date",
        ...sf("date"),
        onCell: () => ({ style: { whiteSpace: "normal" } }),
        render: (v: any, r: any) => ({
          children: v || "-",
          props: { rowSpan: r.__transaction_row_span ?? 1 },
        }),
      },
      {
        title: "Status",
        dataIndex: "status_label",
        ...sf("status_label"),
        render: (v: any, r: any) => {
          const meta = getTransactionStatusMeta({
            transactionStatus: String(r.status ?? ""),
            transactionStatusLabel: v,
            failureSource: r.failure_source,
          });
          return {
            children: (
              <Tag color={meta.color} style={{ margin: 0, fontWeight: 500 }}>
                {meta.text || v || "-"}
              </Tag>
            ),
            props: { rowSpan: r.__transaction_row_span ?? 1 },
          };
        },
      },
      {
        title: "Produk",
        dataIndex: "product_name",
        ...sf("product_name"),
        render: (v: any, r: any) => {
          if (r.is_gift_item) {
            const name = String(v || "").replace(/^GIFT\s*-\s*/i, "") || "-";
            return (
              <Tag color="green" style={{ margin: 0, fontWeight: 500 }}>
                GIFT · {name}
              </Tag>
            );
          }
          return v || "-";
        },
      },
      {
        title: "Brand",
        dataIndex: "brand",
        ...sf("brand"),
      },
      ...(dimensions.includes("customer")
        ? [
            {
              title: "Customer",
              dataIndex: "customer_name",
              ...sf("customer_name"),
              render: (v: any, r: any) => ({
                children: v || "-",
                props: { rowSpan: r.__transaction_row_span ?? 1 },
              }),
            },
          ]
        : []),
      ...(dimensions.includes("master_sku")
        ? [{ title: "SKU", dataIndex: "master_sku", ...sf("master_sku") }]
        : []),
      ...(dimensions.includes("variant_label")
        ? [{ title: "Variant", dataIndex: "variant_label", ...sf("variant_label") }]
        : []),
      ...(dimensions.includes("channel")
        ? [
            {
              title: "Channel",
              dataIndex: "channel",
              ...sf("channel"),
              render: (v: any, r: any) => {
                const channelColor: Record<string, string> = {
                  ecommerce: "blue",
                  pos: "purple",
                  online: "blue",
                  offline: "purple",
                };
                const color = channelColor[String(v || "").toLowerCase()] || "default";
                return {
                  children: v ? (
                    <Tag color={color} style={{ margin: 0, fontWeight: 500, textTransform: "capitalize" }}>
                      {v}
                    </Tag>
                  ) : (
                    "-"
                  ),
                  props: { rowSpan: r.__transaction_row_span ?? 1 },
                };
              },
            },
          ]
        : []),
      {
        title: "Qty",
        dataIndex: "qty",
        align: "right" as const,
        ...sf("qty"),
        render: (v: any) => new Intl.NumberFormat("id-ID").format(Number(v || 0)),
      },
      {
        title: "Base Price",
        dataIndex: "base_price",
        align: "right" as const,
        ...sf("base_price"),
        render: (v: any) => fmtIDR(v),
      },
      {
        title: "Harga Produk (Rp)",
        dataIndex: "price",
        align: "right" as const,
        ...sf("price"),
        render: (v: any) => fmtIDR(v),
      },
      {
        title: "Diskon Produk",
        dataIndex: "discount_product",
        align: "right" as const,
        ...sf("discount_product"),
        render: (v: any) => fmtIDR(v),
      },
      {
        title: "Ongkos Kirim",
        dataIndex: "shipping_cost",
        align: "right" as const,
        ...sf("shipping_cost"),
        render: (v: any, r: any) => ({
          children: fmtIDR(v),
          props: { rowSpan: r.__transaction_row_span ?? 1 },
        }),
      },
      {
        title: "Diskon Ongkir",
        dataIndex: "discount_shipping",
        align: "right" as const,
        ...sf("discount_shipping"),
        render: (v: any, r: any) => ({
          children: fmtIDR(v),
          props: { rowSpan: r.__transaction_row_span ?? 1 },
        }),
      },
      {
        title: "Ongkir Dibayar",
        dataIndex: "shipping_paid",
        align: "right" as const,
        ...sf("shipping_paid"),
        render: (v: any, r: any) => ({
          children: fmtIDR(v),
          props: { rowSpan: r.__transaction_row_span ?? 1 },
        }),
      },
      {
        title: "Sub Total (Rp)",
        dataIndex: "sub_total",
        align: "right" as const,
        ...sf("sub_total"),
        render: (v: any) => fmtIDR(v),
      },
    ];
  }, [dimensions, sortConfig]);

  // Fix #1: client-side CSV — one row per transaction; item columns use newline within cell
  const handleDownloadCsv = async () => {
    setExportingCsv(true);
    const hide = message.loading("Menyiapkan CSV...", 0);
    try {
      const payload = buildExportRequest("csv");
      const r = await createAndWaitReport(payload);
      const blob = await downloadReport(r.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getExportFileName("csv");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      message.success("CSV berhasil diunduh");
    } catch (e: any) {
      message.error(e?.message || "Gagal mengunduh CSV");
    } finally {
      hide();
      setExportingCsv(false);
    }
  };

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!filter) return;
    run(filter, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, brandFilter]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [total, pageSize, page]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  const handleExcelExport = async () => {
    setExportingExcel(true);
    const hide = message.loading("Menyiapkan Excel...", 0);
    try {
      const payload = buildExportRequest("excel");
      const r = await createAndWaitReport(payload);
      const blob = await downloadReport(r.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getExportFileName("excel");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      message.success("Excel berhasil diunduh");
    } catch (e: any) {
      message.error(e?.message || "Gagal mengunduh Excel");
    } finally {
      hide();
      setExportingExcel(false);
    }
  };

  const exportMenuItems = [
    {
      key: "csv",
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {exportingCsv ? "Menyiapkan CSV..." : "Export CSV"}
          <Tooltip title="Data lengkap dari server — semua transaksi sesuai filter tanggal dan status">
            <InfoCircleOutlined style={{ color: "#8c8c8c", fontSize: 12 }} />
          </Tooltip>
        </span>
      ),
      icon: <DownloadOutlined />,
      onClick: handleDownloadCsv,
      disabled: loading || exportingCsv || exportingExcel,
    },
    {
      key: "excel",
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {exportingExcel ? "Menyiapkan Excel..." : "Export Excel"}
          <Tooltip title="Data lengkap dari server — semua transaksi sesuai filter tanggal dan status">
            <InfoCircleOutlined style={{ color: "#8c8c8c", fontSize: 12 }} />
          </Tooltip>
        </span>
      ),
      icon: <DownloadOutlined />,
      onClick: handleExcelExport,
      disabled: loading || exportingCsv || exportingExcel,
    },
  ];

  const renderHeaderActions = () => (
    <>
      <Dropdown
        menu={{ items: exportMenuItems }}
        placement="bottomRight"
        disabled={exportingCsv || exportingExcel}
      >
        <Button
          icon={<DownloadOutlined />}
          loading={exportingCsv || exportingExcel}
        >
          Export <DownOutlined style={{ fontSize: 10 }} />
        </Button>
      </Dropdown>

      <Button onClick={handlePrint} disabled={!report} loading={loading}>
        Print
      </Button>
    </>
  );

  const showChipsRow = activeCount > 0 || dimensions.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <Text style={{ color: "#1677ff", fontWeight: 600 }}>{pageTitle}</Text>
          <Title level={4} style={{ margin: 0, marginTop: 6 }}>
            Detail Transaksi
          </Title>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2 md:mt-0 md:ml-auto md:justify-end">
          {renderHeaderActions()}
        </div>
      </div>

      {/* Date filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Space wrap>
          <DateRangeFilter
            defaultPreset="today"
            showApplyMessage={false}
            onApply={(value) => {
              setFilter(value);
              setSortConfig(null); // Fix #2: reset sort when date range changes
              run(value, status);
            }}
          />
        </Space>
      </div>

      {/* Summary cards — Fix #4: show spinner while loading instead of stale values */}
      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <Text type="secondary">
            {productView === "all" ? "Total Transaksi" : "Total Produk"}
          </Text>
          <Title level={4} style={{ margin: 0 }}>
            {loading ? <Spin size="small" /> : fmtIDR(summary.total_transactions)}
          </Title>
        </Card>
        <Card>
          <Text type="secondary">Total Amount (Rp)</Text>
          <Title level={4} style={{ margin: 0 }}>
            {loading ? <Spin size="small" /> : fmtIDR(summary.total_amount)}
          </Title>
        </Card>
        <Card>
          <Text type="secondary">Total Diskon (Rp)</Text>
          <Title level={4} style={{ margin: 0 }}>
            {loading ? <Spin size="small" /> : fmtIDR(summary.total_discount)}
          </Title>
        </Card>
        <Card>
          <Text type="secondary">Rata-rata / Transaksi (Rp)</Text>
          <Title level={4} style={{ margin: 0 }}>
            {loading ? <Spin size="small" /> : fmtIDR(summary.avg_transaction_value)}
          </Title>
        </Card>
      </div>

      {/* Table */}
      <div ref={printRef}>
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Input.Search
                placeholder="Cari no. transaksi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={(v) => setSearch(v)}
                allowClear
                style={{ width: 240 }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                <Select
                  mode="multiple"
                  placeholder="Tambah Dimensi"
                  value={dimensions}
                  onChange={(v) => setDimensions(v as DimensionKey[])}
                  options={DIMENSION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  style={{ minWidth: 160 }}
                  maxTagCount={0}
                  maxTagPlaceholder={(omitted) => `${omitted.length} dimensi aktif`}
                  allowClear
                />
                <Badge count={activeCount} size="small">
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setFilterDrawerOpen(true)}
                    type={activeCount > 0 ? "primary" : "default"}
                  >
                    Filter
                  </Button>
                </Badge>
              </div>
            </div>
          }
          styles={{ header: { padding: "12px 24px" }, body: { padding: "12px 24px" } }}
        >
          {/* Fix #5: data filter chips */}
          {activeCount > 0 && (
            <ActiveFilterChips
              status={status}
              productView={productView}
              brandFilter={brandFilter}
              activeCount={activeCount}
              onRemoveStatus={() => {
                setStatus("all");
                setPage(1);
              }}
              onRemoveProductView={() => {
                setProductView("all");
                setPage(1);
              }}
              onRemoveBrand={() => {
                setBrandFilter("all");
                setPage(1);
              }}
              onResetAll={() => {
                setStatus("all");
                setProductView("all");
                setBrandFilter("all");
                setPage(1);
              }}
            />
          )}

          {/* Fix #5: dimension chips — separate from data filters, different color */}
          {dimensions.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                Kolom aktif:
              </Text>
              {dimensions.map((dim) => {
                const opt = DIMENSION_OPTIONS.find((o) => o.value === dim);
                return (
                  <Tag
                    key={dim}
                    closable
                    onClose={() =>
                      setDimensions((prev) => prev.filter((d) => d !== dim))
                    }
                    style={{ margin: 0 }}
                  >
                    {opt?.label ?? dim}
                  </Tag>
                );
              })}
            </div>
          )}

          {/* Fix #3: drawer shows spinner + disables selects while loading */}
          <Drawer
            title="Filter Laporan"
            placement="right"
            width={340}
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            footer={
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Button
                  type="primary"
                  block
                  onClick={() => {
                    setStatus(draftStatus);
                    setProductView(draftProductView);
                    setBrandFilter(draftBrandFilter);
                    setPage(1);
                    setFilterDrawerOpen(false);
                  }}
                >
                  Terapkan Filter
                </Button>
                {draftActiveCount > 0 && (
                  <Button
                    block
                    onClick={() => {
                      setDraftStatus("all");
                      setDraftProductView("all");
                      setDraftBrandFilter("all");
                    }}
                  >
                    Reset Semua
                  </Button>
                )}
              </div>
            }
          >
            <Spin spinning={loading} tip="Memuat data...">
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Status Transaksi
                  </Text>
                  <Select
                    value={draftStatus}
                    onChange={(v) => setDraftStatus(v)}
                    style={{ width: "100%" }}
                    options={STATUS_OPTIONS}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Jenis Produk
                  </Text>
                  <Select
                    value={draftProductView}
                    onChange={(v) => setDraftProductView(v)}
                    style={{ width: "100%" }}
                    options={PRODUCT_VIEW_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Brand
                  </Text>
                  <Select
                    value={draftBrandFilter}
                    onChange={(v) => setDraftBrandFilter(v)}
                    style={{ width: "100%" }}
                    options={brandOptions}
                    showSearch
                    optionFilterProp="label"
                    disabled={loading}
                  />
                </div>
              </div>
            </Spin>
          </Drawer>

          <div className="transaction-report-table">
            <style>{`
              .transaction-report-table .ant-table-tbody > tr > td {
                transition: background-color 0.15s;
                white-space: nowrap;
              }
              .transaction-report-table .ant-table-thead > tr > th {
                white-space: nowrap;
              }
              .transaction-report-table .ant-table-tbody > tr:hover > td {
                background-color: transparent !important;
              }
              .transaction-report-table .ant-table-tbody > tr.row-group-hovered > td {
                background-color: #f0f0f0 !important;
              }
            `}</style>
            <Table
              rowKey={(r: any) => r.__key}
              loading={loading}
              dataSource={pagedRows}
              columns={columns as any}
              sortDirections={["ascend", "descend", "ascend"]}
              scroll={{ x: "max-content" }}
              tableLayout="auto"
              pagination={false}
              onChange={(_pagination, _filters, sorter) => {
                const s = Array.isArray(sorter) ? sorter[0] : sorter;
                const field = s?.columnKey ?? s?.field;
                if (field && s?.order) {
                  setSortConfig({ field: String(field), order: s.order });
                } else {
                  setSortConfig(null);
                }
                setPage(1);
              }}
              rowClassName={(r: any) =>
                r.__transaction_group_key === hoveredGroup ? "row-group-hovered" : ""
              }
              onRow={(r: any) => ({
                onMouseEnter: () => setHoveredGroup(r.__transaction_group_key),
                onMouseLeave: () => setHoveredGroup(null),
              })}
            />
          </div>
          <TablePagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={(nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            }}
          />
        </Card>
      </div>

      <OrderManagementModal
        visible={managementModalVisible}
        onCancel={() => setManagementModalVisible(false)}
        selectedTx={selectedTx}
        downloadInvoice={downloadInvoice}
        setSearchParams={() => {}}
        trackingLoading={trackingLoading}
        trackingData={trackingData}
      />
    </div>
  );
}
