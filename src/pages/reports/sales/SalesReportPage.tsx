import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Space,
  Table,
  Typography,
  message,
  Row,
  Col,
  theme,
} from "antd";
import {
  ShoppingOutlined,
  DollarOutlined,
  TagOutlined,
  LineChartOutlined,
  WalletOutlined,
  GlobalOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import { useReactToPrint } from "react-to-print";
import { createAndWaitReport } from "../_shared/reportRunner";
import {
  type CreateReportPayload,
  type ReportEntity,
  type ReportFormat,
  type ReportPeriod,
} from "../../../services/api/report.services";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  ComposedChart,
  Area,
} from "recharts";
import DateRangeFilter, {
  type DateRangeFilterValue,
} from "../../../components/Report/DateRangeFilter";
import Export from "../../../components/Report/Export";
import DetailModal from "../../../components/Report/DetailModal";
import TablePagination from "../../../components/Tables/Pagination/TablePagination";
import { numberSorter } from "../../../utils/tableSorters";

const { Text, Title } = Typography;

const fmtIDR = (n: any) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    Number(n || 0),
  );

const getViewPeriodByFilter = (filter: DateRangeFilterValue): ReportPeriod => {
  if (filter.preset === "this_month") return "monthly";
  if (filter.preset === "custom") {
    const [start, end] = filter.range;
    return start.isSame(end, "month") ? "daily" : "monthly";
  }
  return "daily";
};

const buildDailyProductRowsFromTransactions = (transactions: any[]) => {
  const map = new Map<string, any>();

  for (const trx of transactions) {
    const trxDateRaw = trx?.date || trx?.created_at || trx?.transaction_date;
    const trxDate = dayjs(trxDateRaw).isValid()
      ? dayjs(trxDateRaw).format("YYYY-MM-DD")
      : String(trxDateRaw || "-");

    const items = Array.isArray(trx?.items) ? trx.items : [];
    for (const it of items) {
      const rawAttributes = it?.attributes;
      const attributes =
        rawAttributes && typeof rawAttributes === "string"
          ? (() => {
              try {
                return JSON.parse(rawAttributes);
              } catch {
                return {};
              }
            })()
          : rawAttributes && typeof rawAttributes === "object"
            ? rawAttributes
            : {};

      const isGiftItem = Boolean(
        it?.isGiftItem === true ||
          it?.is_gift_item === true ||
          it?.is_b1g1_gift === true ||
          attributes?.is_gift === true ||
          attributes?.is_gift === "true" ||
          attributes?.gift_name ||
          attributes?.gift_product_id,
      );

      const sku =
        it?.sku ||
        it?.variant_sku ||
        it?.product_sku ||
        it?.variant?.sku ||
        it?.variant?.barcode ||
        attributes?.sku ||
        attributes?.gift_sku ||
        "-";
      const name =
        it?.product_name ||
        it?.name ||
        it?.product?.name ||
        attributes?.product_name ||
        attributes?.name ||
        attributes?.gift_name ||
        "-";
      const brand =
        it?.brand ||
        it?.brand_name ||
        it?.product?.brand?.name ||
        attributes?.brand_name ||
        attributes?.gift_brand_name ||
        "-";
      const qty = Number(it?.qty ?? it?.quantity ?? 0);
      const discount = Number(it?.discount ?? 0);
      const revenue = Number(
        it?.sub_total ?? it?.subtotal ?? it?.amount ?? it?.total ?? 0,
      );
      const txId = String(
        trx?.id ?? trx?.transaction_number ?? `${trxDate}-${name}-${sku}`,
      );

      const hasIdentity =
        sku !== "-" || name !== "-" || brand !== "-" || revenue > 0;

      if (isGiftItem || !hasIdentity) {
        continue;
      }

      const key = `${trxDate}|${sku}|${name}|${brand}`;
      if (!map.has(key)) {
        map.set(key, {
          date: trxDate,
          sku,
          name,
          brand_name: brand,
          total_sold: 0,
          total_transactions: 0,
          discount_allocated: 0,
          total_revenue: 0,
          __txSet: new Set<string>(),
        });
      }

      const acc = map.get(key);
      acc.total_sold += qty;
      acc.discount_allocated += discount;
      acc.total_revenue += revenue;
      if (!acc.__txSet.has(txId)) {
        acc.__txSet.add(txId);
        acc.total_transactions += 1;
      }
    }
  }

  return Array.from(map.values())
    .map((r) => ({
      date: r.date,
      sku: r.sku,
      name: r.name,
      brand_name: r.brand_name,
      total_sold: r.total_sold,
      total_transactions: r.total_transactions,
      discount_allocated: r.discount_allocated,
      total_revenue: r.total_revenue,
      avg_selling_price: r.total_sold > 0 ? r.total_revenue / r.total_sold : 0,
    }))
    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
};

export default function SalesReportPage() {
  const { token } = theme.useToken();
  const pageTitle = "Laporan Penjualan";

  const [filter, setFilter] = useState<DateRangeFilterValue>(() => {
    const now = dayjs();
    return {
      preset: "today",
      range: [now.startOf("day"), now.endOf("day")],
    };
  });

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportEntity | null>(null);
  const [periodDetail, setPeriodDetail] = useState<any | null>(null);
  const [periodDetailLoading, setPeriodDetailLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const inFlightJsonKeyRef = useRef<string | null>(null);
  const didInitialLoadRef = useRef(false);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${pageTitle} - ${getViewPeriodByFilter(filter) === "daily" ? "Penjualan per Hari" : "Penjualan per Bulan"}`,
  });

  const PRESET_OPTIONS = [
    { value: "today", label: "Hari ini" },
    { value: "7d", label: "7 Hari" },
    { value: "this_month", label: "Bulan ini" },
  ];

  const run = async (
    format: ReportFormat = "json",
    currentFilter: DateRangeFilterValue = filter,
  ) => {
    const viewPeriod = getViewPeriodByFilter(currentFilter);
    if (format === "json") {
      const runKey = [
        viewPeriod,
        currentFilter.preset,
        currentFilter.range[0].toISOString(),
        currentFilter.range[1].toISOString(),
      ].join("|");

      if (inFlightJsonKeyRef.current === runKey) {
        return;
      }
      inFlightJsonKeyRef.current = runKey;
    }

    setLoading(true);
    try {
      const presetLabel =
        currentFilter.preset === "custom"
          ? `${currentFilter.range[0].format("YYYY-MM-DD")} s/d ${currentFilter.range[1].format("YYYY-MM-DD")}`
          : PRESET_OPTIONS.find((p) => p.value === currentFilter.preset)
              ?.label || currentFilter.preset;

      const r = await createAndWaitReport({
        title: `${pageTitle} - ${viewPeriod === "daily" ? "Penjualan per Hari" : "Penjualan per Bulan"}`,
        report_type: "sales" as any,
        report_period: viewPeriod,
        report_format: format,
        start_date: currentFilter.range[0].toISOString(),
        end_date: currentFilter.range[1].toISOString(),
        channel: "all",
        filters: { preset_label: presetLabel },
      });

      setReport(r);
    } catch (e: any) {
      message.error(e?.message || "Gagal generate laporan");
    } finally {
      if (format === "json") {
        inFlightJsonKeyRef.current = null;
      }
      setLoading(false);
    }
  };

  const buildExportRequest = (format: "excel" | "csv"): CreateReportPayload => {
    const viewPeriod = getViewPeriodByFilter(filter);
    const presetLabel =
      filter.preset === "custom"
        ? `${filter.range[0].format("YYYY-MM-DD")} s/d ${filter.range[1].format("YYYY-MM-DD")}`
        : PRESET_OPTIONS.find((p) => p.value === filter.preset)?.label ||
          filter.preset;

    return {
      title: `${pageTitle} - ${viewPeriod === "daily" ? "Penjualan per Hari" : "Penjualan per Bulan"}`,
      report_type: "sales" as any,
      report_period: viewPeriod,
      report_format: format,
      start_date: filter.range[0].toISOString(),
      end_date: filter.range[1].toISOString(),
      channel: "all",
      filters: { preset_label: presetLabel },
    };
  };

  const viewPeriod = getViewPeriodByFilter(filter);
  const getExportFileName = (format: "excel" | "csv") =>
    `${pageTitle}-${viewPeriod}-${dayjs().format("YYYYMMDD")}.${format === "excel" ? "xlsx" : "csv"}`;

  const summary = report?.summary || {};
  const data = report?.data || {};
  const grouped = Array.isArray(data.grouped_by_period)
    ? data.grouped_by_period
    : [];
  const total = grouped.length;
  const byChannel: Record<string, any> = summary?.by_channel || {};

  const periodLabel = (r: any) => {
    if (r?.month_name) return r.month_name;
    if (r?.date) return r.date;
    if (r?.week_start && r?.week_end) return `${r.week_start} - ${r.week_end}`;
    if (r?.year) return r.year;
    return r?.period || "-";
  };

  const periodSortValue = (r: any): number => {
    if (r?.date) {
      const d = dayjs(r.date);
      if (d.isValid()) return d.valueOf();
    }
    if (r?.year && (r?.month || r?.month_number)) {
      const monthNum = Number(r.month ?? r.month_number);
      if (!Number.isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        return dayjs()
          .year(Number(r.year))
          .month(monthNum - 1)
          .startOf("month")
          .valueOf();
      }
    }
    if (r?.month_name) {
      const d = dayjs(r.month_name);
      if (d.isValid()) return d.valueOf();
    }
    if (r?.period) {
      const d = dayjs(r.period);
      if (d.isValid()) return d.valueOf();
    }
    return 0;
  };

  const resolvePeriodRange = (row: any): [dayjs.Dayjs, dayjs.Dayjs] | null => {
    if (row?.date) {
      const d = dayjs(row.date);
      if (d.isValid()) return [d.startOf("day"), d.endOf("day")];
    }

    if (row?.year && (row?.month || row?.month_number)) {
      const monthNum = Number(row.month ?? row.month_number);
      if (!Number.isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        const d = dayjs()
          .year(Number(row.year))
          .month(monthNum - 1);
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
  };

  const openPeriodDetail = async (row: any) => {
    const rangeByPeriod = resolvePeriodRange(row);
    if (!rangeByPeriod) {
      message.warning("Rentang periode tidak valid untuk dibuka detailnya");
      return;
    }

    setPeriodDetail({ ...row, products: [], items: [] });
    setPeriodDetailLoading(true);

    try {
      const productReport = await createAndWaitReport({
        title: `${pageTitle} - Detail ${periodLabel(row)}`,
        report_type: "product",
        report_period: "custom",
        report_format: "json",
        start_date: rangeByPeriod[0].toISOString(),
        end_date: rangeByPeriod[1].toISOString(),
        channel: "all",
      });

      const isMonthlyRow = Boolean(
        row?.month_name || (row?.year && (row?.month || row?.month_number)),
      );
      let transformedProducts: any[] | null = null;

      if (isMonthlyRow) {
        const trxReport = await createAndWaitReport({
          title: `${pageTitle} - Detail Transaksi ${periodLabel(row)}`,
          report_type: "transaction",
          report_period: "custom",
          report_format: "json",
          start_date: rangeByPeriod[0].toISOString(),
          end_date: rangeByPeriod[1].toISOString(),
          channel: "all",
        });

        const transactions = Array.isArray(trxReport?.data?.transactions)
          ? trxReport.data.transactions
          : [];
        transformedProducts =
          buildDailyProductRowsFromTransactions(transactions);
      }

      setPeriodDetail({
        ...row,
        products:
          transformedProducts && transformedProducts.length > 0
            ? transformedProducts
            : Array.isArray(productReport?.data?.products)
              ? productReport.data.products
              : [],
        items: Array.isArray(productReport?.data?.items)
          ? productReport.data.items
          : [],
      });
    } catch (e: any) {
      message.error(e?.message || "Gagal memuat detail bulan");
      setPeriodDetail(null);
    } finally {
      setPeriodDetailLoading(false);
    }
  };

  useEffect(() => {
    if (didInitialLoadRef.current) return;
    didInitialLoadRef.current = true;
    run("json", filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [total, pageSize, page]);

  const columnsPeriod = [
    {
      title:
        viewPeriod === "daily" ? "Penjualan per Hari" : "Penjualan per Bulan",
      dataIndex: "__period",
      sorter: (a: any, b: any) => periodSortValue(a) - periodSortValue(b),
      render: (_: any, r: any) => {
        const label = periodLabel(r);
        if (r?.month_name || r?.date) {
          return (
            <Button
              type="link"
              style={{ padding: "4px 8px", height: "auto" }}
              onClick={() => openPeriodDetail(r)}
            >
              {label}
            </Button>
          );
        }
        return label;
      },
    },
    {
      title: "Jumlah Transaksi",
      dataIndex: "transactions",
      align: "right" as const,
      sorter: numberSorter<any>("transactions"),
      render: (v: any) => fmtIDR(v),
    },
    {
      title: "Total Harga Item",
      dataIndex: "items_subtotal",
      align: "right" as const,
      sorter: numberSorter<any>("items_subtotal"),
      render: (v: any) => fmtIDR(v),
    },
    {
      title: "Ongkir",
      dataIndex: "shipping_cost",
      align: "right" as const,
      sorter: numberSorter<any>("shipping_cost"),
      render: (v: any) => fmtIDR(v),
    },
    {
      title: "Penjualan Kotor",
      dataIndex: "gross_sales",
      align: "right" as const,
      sorter: numberSorter<any>("gross_sales"),
      render: (v: any, r: any) => (
        <span title="Total Harga Item + Ongkir">
          {fmtIDR(
            v || Number(r.items_subtotal || 0) + Number(r.shipping_cost || 0),
          )}
        </span>
      ),
    },
    {
      title: "Diskon",
      dataIndex: "discount",
      align: "right" as const,
      sorter: numberSorter<any>("discount"),
      render: (v: any) => fmtIDR(v),
    },
    {
      title: "Penjualan Bersih",
      dataIndex: "revenue",
      align: "right" as const,
      sorter: numberSorter<any>("revenue"),
      render: (v: any) => (
        <strong style={{ color: "#52c41a" }}>{fmtIDR(v)}</strong>
      ),
    },
    {
      title: "Item Terjual",
      dataIndex: "items_sold",
      align: "right" as const,
      sorter: numberSorter<any>("items_sold"),
      render: (v: any) => fmtIDR(v),
    },
  ];

  const hoverStyle = `
    .hover-up {
      transition: all 0.3s ease;
      cursor: default;
    }
    .hover-up:hover {
      transform: translateY(-5px);
      box-shadow: ${token.boxShadowSecondary} !important;
    }
  `;

  return (
    <div
      style={{
        padding: 24,
        background: token.colorBgLayout,
        minHeight: "100vh",
      }}
    >
      <style>{hoverStyle}</style>

      {/* header */}
      <div
        className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
        style={{
          marginBottom: 24,
          padding: "16px 24px",
          background: token.colorBgContainer,
          borderRadius: 12,
          boxShadow: token.boxShadowTertiary,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div style={{ flex: 1 }}>
          <Text
            style={{
              color: token.colorPrimary,
              fontWeight: 600,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Dashboard Laporan
          </Text>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-end">
          <DateRangeFilter
            defaultPreset="today"
            onApply={(value) => {
              setFilter(value);
              run("json", value);
            }}
          />

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Export
              buildRequest={buildExportRequest}
              getDownloadFileName={getExportFileName}
              formats={["excel", "csv"]}
            />
            <Button onClick={handlePrint} disabled={!report}>
              Print
            </Button>
          </div>
        </div>
      </div>
      <div ref={printRef}>
        <Card>
          <Table
            rowKey={(r: any, idx: any) =>
              r.id ?? r.period ?? r.date ?? r.sku ?? idx
            }
            loading={loading}
            sortDirections={["ascend", "descend", "ascend"]}
            pagination={{
              current: page,
              pageSize,
              total,
              position: ["none", "none"],
            }}
            onChange={(nextPagination) => {
              setPage(nextPagination.current ?? 1);
              setPageSize(nextPagination.pageSize ?? 10);
            }}
            dataSource={grouped}
            columns={columnsPeriod as any}
            locale={{ emptyText: "Tidak ada data" }}
            scroll={{ x: "max-content" }}
          />
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
      
      {/* summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card
            bordered={false}
            className="shadow-sm hover-up"
            style={{ borderRadius: 12, borderTop: "3px solid #1890ff" }}
          >
            <Space align="start">
              <div
                style={{
                  background: token.colorFillAlter,
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                <ShoppingOutlined
                  style={{ fontSize: 20, color: token.colorPrimary }}
                />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Total Transaksi
                </Text>
                <Title level={4} style={{ margin: 0 }}>
                  {fmtIDR(summary.total_transactions)}
                </Title>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            bordered={false}
            className="shadow-sm hover-up"
            style={{ borderRadius: 12, borderTop: "3px solid #8c8c8c" }}
          >
            <Space align="start">
              <div
                style={{
                  background: token.colorFillAlter,
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                <WalletOutlined
                  style={{ fontSize: 20, color: token.colorTextDescription }}
                />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Total Harga Item
                </Text>
                <Title level={4} style={{ margin: 0 }}>
                  {fmtIDR(summary.total_items_subtotal)}
                </Title>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            bordered={false}
            className="shadow-sm hover-up"
            style={{ borderRadius: 12, borderTop: "3px solid #faad14" }}
          >
            <Space align="start">
              <div
                style={{
                  background: token.colorFillAlter,
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                <GlobalOutlined style={{ fontSize: 20, color: "#faad14" }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Ongkir
                </Text>
                <Title level={4} style={{ margin: 0 }}>
                  {fmtIDR(summary.total_shipping)}
                </Title>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            bordered={false}
            className="shadow-sm hover-up"
            style={{
              borderRadius: 12,
              borderTop: "3px solid #1677ff",
            }}
          >
            <Space align="start">
              <div
                style={{
                  background: token.colorFillAlter,
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                <DollarOutlined
                  style={{ fontSize: 20, color: token.colorPrimary }}
                />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Penjualan Kotor
                </Text>
                <Title
                  level={4}
                  style={{ margin: 0, color: token.colorPrimary }}
                >
                  {fmtIDR(summary.total_gross_sales)}
                </Title>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            bordered={false}
            className="shadow-sm hover-up"
            style={{ borderRadius: 12, borderTop: "3px solid #ff4d4f" }}
          >
            <Space align="start">
              <div
                style={{
                  background: token.colorFillAlter,
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                <TagOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Total Diskon
                </Text>
                <Title level={4} style={{ margin: 0, color: "#ff4d4f" }}>
                  {fmtIDR(summary.total_discount)}
                </Title>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            bordered={false}
            className="shadow-sm hover-up"
            style={{ borderRadius: 12, borderTop: "3px solid #52c41a" }}
          >
            <Space align="start">
              <div
                style={{
                  background: token.colorFillAlter,
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                <LineChartOutlined style={{ fontSize: 20, color: "#52c41a" }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Penjualan Bersih
                </Text>
                <Title level={4} style={{ margin: 0, color: "#52c41a" }}>
                  {fmtIDR(summary.total_revenue)}
                </Title>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* avg order (only for non-period views) */}
      {
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">Avg Order: </Text>
          <Text strong>{fmtIDR(summary.avg_order_value)}</Text>
        </div>
      }

      {/* Channel breakdown row */}
      {Object.keys(byChannel).length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          {Object.entries(byChannel).map(([ch, info]: [string, any]) => (
            <Card key={ch} size="small" style={{ minWidth: 180 }}>
              <Text type="secondary">
                {ch === "ecommerce"
                  ? "🛒 Ecommerce"
                  : ch === "pos"
                    ? "🏪 POS"
                    : ch}
              </Text>
              <div>
                <strong>{fmtIDR(info.revenue)}</strong>
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {info.transactions} transaksi | Diskon: {fmtIDR(info.discount)}
              </Text>
            </Card>
          ))}
        </div>
      )}

      {/* Chart tren (for period mode) */}
      {grouped.length > 0 && (
        <Card
          title="Tren Penjualan"
          style={{
            marginBottom: 24,
            borderRadius: 12,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
          className="shadow-sm"
        >
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart
              data={grouped}
              margin={{ top: 20, right: 30, bottom: 5, left: 20 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#52c41a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#52c41a" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={token.colorBorderSecondary}
              />
              <XAxis
                dataKey={(r: any) =>
                  r.month_name || r.date || r.year || r.period
                }
                tick={{ fontSize: 11, fill: token.colorTextDescription }}
                axisLine={{ stroke: token.colorBorderSecondary }}
                tickLine={false}
                padding={grouped.length === 1 ? { left: 100, right: 100 } : {}}
              />
              <YAxis
                tick={{ fontSize: 11, fill: token.colorTextDescription }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `Rp${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: any) => `Rp ${fmtIDR(v)}`}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: token.boxShadowTertiary,
                  backgroundColor: token.colorBgContainer,
                  color: token.colorText,
                  padding: "12px 16px",
                }}
              />
              <Legend verticalAlign="top" height={48} iconType="circle" />
              <Bar
                dataKey="discount"
                name="Diskon"
                fill="#ff4d4f"
                fillOpacity={0.15}
                barSize={24}
                radius={[4, 4, 0, 0]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Penjualan Bersih (Area)"
                stroke="none"
                fill="url(#colorRevenue)"
                activeDot={false}
              />
              <Line
                type="monotone"
                dataKey="gross_sales"
                name="Penjualan Kotor"
                stroke={token.colorPrimary}
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: token.colorPrimary,
                  strokeWidth: 2,
                  stroke: token.colorBgContainer,
                }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Penjualan Bersih"
                stroke="#52c41a"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "#52c41a",
                  strokeWidth: 2,
                  stroke: token.colorBgContainer,
                }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      )}

      <DetailModal
        open={!!periodDetail}
        detail={periodDetail}
        loading={periodDetailLoading}
        title={
          periodDetail
            ? `Detail Penjualan - ${periodLabel(periodDetail)}`
            : "Detail Penjualan"
        }
        onClose={() => setPeriodDetail(null)}
      />
    </div>
  );
}
