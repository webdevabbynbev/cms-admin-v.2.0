import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  DatePicker,
  Space,
  Table,
  Tag,
  Typography,
  Tooltip as AntTooltip,
  message,
  Spin,
  Avatar,
  Segmented,
  Row,
  Col,
} from "antd";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { 
  UserOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  ReloadOutlined,
  PrinterOutlined,
  DownloadOutlined,
  RiseOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import "./../sales/components/DashboardReport.css";
import dayjs, { Dayjs } from "dayjs";
import { useReactToPrint } from "react-to-print";
import {
  fetchCustomerOverview,
  downloadReport,
  type CustomerOverviewData,
  type CustomerRow,
} from "../../../services/api/report.services";
import { useThemeStore } from "../../../hooks/useThemeStore";
import { createAndWaitReport } from "../_shared/reportRunner";

const { Text, Title } = Typography;
const BLUE = "#1282a2";
const PINK = "#E85580";

// ── Liquid Glass Components ─────────────────────────────────
const GCard = ({ children, accent, style = {} }: any) => (
  <div className="glass-stat-card" style={{ borderTop: `4px solid ${accent}`, ...style }}>
    {children}
  </div>
);

const SLabel = ({ children }: any) => <Text className="glass-stat-label">{children}</Text>;
const SValue = ({ children, style = {} }: any) => <div className="glass-stat-value" style={style}>{children}</div>;
const SSubtitle = ({ children }: any) => <Text className="glass-stat-sub">{children}</Text>;


const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const fmtNum = (n: number) =>
  new Intl.NumberFormat("id-ID").format(n || 0);

const fmtDatetime = (v: any) => {
  if (!v) return "-";
  const d = dayjs(v);
  return d.isValid() ? d.format("DD MMM YYYY") : "-";
};

const LOYALTY_CONFIG: Record<string, { color: string; label: string }> = {
  "BIG SPENDER": { color: "gold", label: "BIG SPENDER" },
  LOYAL: { color: "purple", label: "LOYAL" },
  CUSTOMER: { color: "blue", label: "PELANGGAN" },
};

// StatCard component removed in favor of Liquid Glass components


export default function CustomerReportPage() {
  const { isDarkMode } = useThemeStore();
  const [period, setPeriod] = useState<string>("30d");
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, "day").startOf("day"),
    dayjs().endOf("day"),
  ]);
  const [data, setData] = useState<CustomerOverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const calculateRange = (p: string): [Dayjs, Dayjs] => {
    const end = dayjs().endOf("day");
    if (p === "7d") return [dayjs().subtract(7, "day").startOf("day"), end];
    if (p === "30d") return [dayjs().subtract(30, "day").startOf("day"), end];
    if (p === "90d") return [dayjs().subtract(90, "day").startOf("day"), end];
    return range;
  };

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    if (p !== "custom") {
      const newRange = calculateRange(p);
      setRange(newRange);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Laporan Analisis Pelanggan",
  });

  const load = async (forcedRange?: [Dayjs, Dayjs]) => {
    setLoading(true);
    const targetRange = forcedRange || range;
    try {
      const res = await fetchCustomerOverview({
        start_date: targetRange[0].format("YYYY-MM-DD"),
        end_date: targetRange[1].format("YYYY-MM-DD"),
        channel: "all",
      });
      setData(res);
    } catch (e: any) {
      message.error(e?.message || "Gagal memuat data pelanggan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const r = await createAndWaitReport({
        title: "Laporan Analisis Pelanggan",
        report_type: "customer",
        report_period: "custom",
        report_format: "excel",
        start_date: range[0].toISOString(),
        end_date: range[1].toISOString(),
        channel: "all",
        filters: {},
      });
      const blob = await downloadReport(r.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan-Pelanggan-${range[0].format("YYYYMMDD")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      message.error(e?.message || "Gagal export laporan");
    } finally {
      setExporting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Pelanggan",
        key: "name",
        render: (_: any, rec: CustomerRow) => (
          <Space>
            <Avatar style={{ background: "#db2777" }} icon={<UserOutlined />} size={32} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{rec.name || "-"}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{rec.email || "-"}</div>
            </div>
          </Space>
        ),
      },
      {
        title: "Telepon",
        dataIndex: "phone",
        render: (v: any) => v || "-",
      },
      {
        title: "Transaksi",
        dataIndex: "total_transactions",
        align: "center" as const,
        sorter: (a: CustomerRow, b: CustomerRow) => a.total_transactions - b.total_transactions,
        render: (v: number) => (
          <Tag color="blue" style={{ fontWeight: 700, borderRadius: 20 }}>
            {fmtNum(v)}
          </Tag>
        ),
      },
      {
        title: "Total Belanja",
        dataIndex: "total_spent",
        align: "right" as const,
        sorter: (a: CustomerRow, b: CustomerRow) => a.total_spent - b.total_spent,
        render: (v: number) => (
          <Text strong style={{ color: "#b31f5f" }}>
            {fmtIDR(v)}
          </Text>
        ),
      },
      {
        title: "Avg. Order",
        dataIndex: "avg_order_value",
        align: "right" as const,
        sorter: (a: CustomerRow, b: CustomerRow) => a.avg_order_value - b.avg_order_value,
        render: (v: number) => fmtIDR(v),
      },
      {
        title: "Transaksi Terakhir",
        dataIndex: "last_transaction",
        render: (v: any) => fmtDatetime(v),
      },
      {
        title: "Loyalitas",
        dataIndex: "loyalty",
        align: "center" as const,
        render: (v: string) => {
          const cfg = LOYALTY_CONFIG[v] || { color: "default", label: v };
          return <Tag color={cfg.color} style={{ fontWeight: 700 }}>{cfg.label}</Tag>;
        },
      },
    ],
    []
  );

  const s = data?.summary;

  return (
    <div 
      className="dash-container" 
      style={{ background: isDarkMode ? "transparent" : "#f8fafc", minHeight: "100vh" }}
      data-print-date={dayjs().format("DD MMMM YYYY, HH:mm")}
    >
      <div ref={printRef} style={{ background: "inherit", padding: "0 4px" }}>
      {/* ── Header ── */}
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <Text style={{ color: "#1677ff", fontWeight: 600, fontSize: 12, letterSpacing: 1 }}>
            LAPORAN PELANGGAN
          </Text>
          <Title level={4} style={{ margin: "4px 0 2px" }}>
            Customer Overview
          </Title>
          {s?.period && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Periode: {s.period}
            </Text>
          )}
        </div>

        <Space wrap size={16}>
          <Segmented
            value={period}
            onChange={(v) => handlePeriodChange(v as string)}
            options={[
              { label: "7 Hari", value: "7d" },
              { label: "30 Hari", value: "30d" },
              { label: "90 Hari", value: "90d" },
              { label: "Custom", value: "custom" },
            ]}
            style={{ 
              background: "var(--color-bg-container)", 
              border: "1px solid var(--color-border-secondary, #f0f0f0)",
              borderRadius: 8,
              padding: 2
            }}
          />
          {period === "custom" && (
            <DatePicker.RangePicker
              value={range}
              allowClear={false}
              onChange={(v) => {
                if (v?.[0] && v?.[1]) setRange([v[0], v[1]]);
              }}
              style={{ borderRadius: 8 }}
            />
          )}
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => load()}
          >
            Terapkan
          </Button>
          <AntTooltip title="Export Excel">
            <Button
              icon={<DownloadOutlined />}
              loading={exporting}
              onClick={handleExport}
            >
              Export
            </Button>
          </AntTooltip>
          <AntTooltip title="Print Laporan">
            <Button icon={<PrinterOutlined />} onClick={() => handlePrint()} />
          </AntTooltip>
        </Space>
      </div>

      {/* ── Stats Cards ── */}
      <Spin spinning={loading} tip="Memuat data…">
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} md={8}>
            <GCard accent={BLUE}>
              <div className="glass-stat-header">
                <TeamOutlined style={{ color: BLUE, fontSize: 16 }} />
                <SLabel>Total Pelanggan Aktif</SLabel>
              </div>
              <SValue>{fmtNum(s?.total_customers || 0)}</SValue>
              <SSubtitle>{fmtNum(s?.repeat_customers || 0)} pelanggan repeat</SSubtitle>
            </GCard>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <GCard accent={PINK}>
              <div className="glass-stat-header">
                <DollarOutlined style={{ color: PINK, fontSize: 16 }} />
                <SLabel>Total Revenue</SLabel>
              </div>
              <SValue>{fmtIDR(s?.total_revenue || 0)}</SValue>
              <SSubtitle>Pendapatan terakumulasi</SSubtitle>
            </GCard>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <GCard accent={BLUE}>
              <div className="glass-stat-header">
                <UserOutlined style={{ color: BLUE, fontSize: 16 }} />
                <SLabel>Avg. Customer Value</SLabel>
              </div>
              <SValue>{fmtIDR(s?.avg_customer_value || 0)}</SValue>
              <SSubtitle>per pelanggan aktif</SSubtitle>
            </GCard>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <GCard accent={PINK}>
              <div className="glass-stat-header">
                <ShoppingCartOutlined style={{ color: PINK, fontSize: 16 }} />
                <SLabel>Total Transaksi</SLabel>
              </div>
              <SValue>{fmtNum(s?.total_transactions || 0)}</SValue>
              <SSubtitle>Selama periode terpilih</SSubtitle>
            </GCard>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <GCard accent={BLUE}>
              <div className="glass-stat-header">
                <RiseOutlined style={{ color: BLUE, fontSize: 16 }} />
                <SLabel>Repeat Rate</SLabel>
              </div>
              <SValue>{s?.repeat_rate || 0}%</SValue>
              <SSubtitle>Pelanggan beli {">"}1x</SSubtitle>
            </GCard>
          </Col>
        </Row>

        {/* ── Monthly Trend Chart ── */}
        {data?.daily_trend && data.daily_trend.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div className="section-label" style={{ marginBottom: 0 }}>TREN PEMBELI & PENDAPATAN</div>
              <div style={{ height: 1, flex: 1, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
              <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>AKTIVITAS HARIAN</Text>
            </div>
            <GCard accent={BLUE} style={{ padding: "20px 24px 10px", height: "auto" }}>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={data.daily_trend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradBuyers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BLUE} stopOpacity={0.6} />
                        <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PINK} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={PINK} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradRegistrations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: "var(--color-text-description, #94a3b8)" }}
                      tickFormatter={(v) => dayjs(v).format("D MMM")}
                      dy={10}
                    />
                    <YAxis 
                      yAxisId="left" 
                      axisLine={false} 
                      tickLine={false} 
                      width={30}
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      axisLine={false} 
                      tickLine={false} 
                      width={50}
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                      tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
                    />
                    <ChartTooltip
                      contentStyle={{ 
                        borderRadius: 12, 
                        border: isDarkMode ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(0,0,0,0.1)", 
                        boxShadow: "0 10px 40px rgba(0,0,0,0.3)", 
                        background: isDarkMode ? "#141414" : "#fff",
                        backdropFilter: "blur(12px)",
                        padding: "12px 16px",
                      }}
                      itemStyle={{ padding: "2px 0", fontWeight: 700, color: isDarkMode ? "#ffffff" : "#1e293b" }}
                      labelStyle={{ color: isDarkMode ? "#94a3b8" : "#64748b", marginBottom: 6, fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}
                      cursor={{ stroke: isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)", strokeWidth: 2 }}
                      formatter={(val: any, name: string) => {
                        if (name === "registrations") return [fmtNum(val), "Pendaftaran"];
                        if (name === "unique_buyers") return [fmtNum(val), "Pembeli Unik"];
                        return [fmtIDR(val), "Revenue"];
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      iconType="circle"
                      wrapperStyle={{ paddingTop: 0, paddingBottom: 20, fontSize: 12, fontWeight: 600 }}
                      formatter={(value) => {
                        const labels: any = { unique_buyers: "Pembeli Unik", revenue: "Revenue", registrations: "Pendaftaran" };
                        return <span style={{ color: "var(--color-text)" }}>{labels[value] || value}</span>;
                      }}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="unique_buyers" 
                      stroke={BLUE} 
                      fill="url(#gradBuyers)" 
                      strokeWidth={4} 
                      dot={{ r: 4, fill: BLUE, strokeWidth: 2, stroke: isDarkMode ? "#1c1c1e" : "#fff" }} 
                      activeDot={{ r: 7, strokeWidth: 0, fill: BLUE }}
                      animationDuration={1000}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="registrations" 
                      stroke="#8b5cf6" 
                      fill="url(#gradRegistrations)" 
                      strokeWidth={2} 
                      dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 2, stroke: isDarkMode ? "#1c1c1e" : "#fff" }} 
                      activeDot={{ r: 5, strokeWidth: 0, fill: "#8b5cf6" }}
                      animationDuration={1100}
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={PINK} 
                      fill="url(#gradRevenue)" 
                      strokeWidth={3} 
                      dot={{ r: 3, fill: PINK, strokeWidth: 2, stroke: isDarkMode ? "#1c1c1e" : "#fff" }} 
                      activeDot={{ r: 6, strokeWidth: 0, fill: PINK }}
                      strokeDasharray="5 5"
                      animationDuration={1200}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GCard>
          </div>
        )}

        {/* ── Top 10 Pelanggan ── */}
        <div style={{ marginBottom: 20 }}>
          <div className="section-label">🏆 TOP 10 PELANGGAN</div>
          <GCard accent={PINK} style={{ padding: 0, overflow: "hidden", height: "auto" }}>
            <Table
              rowKey="id"
              dataSource={data?.top_customers || []}
              columns={columns}
              loading={loading}
              pagination={false}
              size="small"
              scroll={{ x: 700 }}
              rowClassName="seo-row"
            />
          </GCard>
        </div>

        {/* ── Semua Pelanggan Aktif ── */}
        <div style={{ marginBottom: 20 }}>
          <div className="section-label">👥 SEMUA PELANGGAN AKTIF</div>
          <GCard accent={BLUE} style={{ padding: 0, overflow: "hidden", height: "auto" }}>
            <Table
              rowKey="id"
              dataSource={data?.customers || []}
              columns={columns}
              loading={loading}
              pagination={{ 
                pageSize: 25, 
                showTotal: (t) => `Total ${fmtNum(t)} pelanggan`,
                position: ["bottomRight"] 
              }}
              size="small"
              scroll={{ x: 700 }}
              rowClassName="seo-row"
            />
          </GCard>
        </div>

        {!data && !loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
            Pilih periode dan klik <strong>Terapkan</strong> untuk memuat data
          </div>
        )}
      </Spin>
      </div>
    </div>
  );
}
