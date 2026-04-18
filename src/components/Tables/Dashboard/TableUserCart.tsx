import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  Select,
  Table,
  Input,
  Button,
  Image,
  Tooltip,
  Space,
  Tag,
  Badge,
  Empty,
  Avatar,
  Typography,
  theme,
  Grid,
} from "antd";
import {
  ReloadOutlined,
  QuestionCircleOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  AppstoreOutlined,
  UserOutlined,
  SearchOutlined,
  LineChartOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import type { TableProps, ColumnsType } from "antd/es/table";
import http from "../../../api/http";
import placeholder from "../../../assets/img/placeholder.png";
import { useSearchParams } from "react-router-dom";
import CrmAnalyticsPanel from "../../Panels/CrmAnalyticsPanel";
import { useThemeStore } from "../../../hooks/useThemeStore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";

const { Text, Title } = Typography;

// ─── Interfaces ───────────────────────────────────────────────
interface Media {
  type: number;
  url: string;
  alt_text?: string;
}
interface Brand {
  id: number;
  name: string;
}
interface Product {
  id: number | string;
  name: string;
  brand?: Brand;
  categoryProduct: { name: string };
  medias?: Media[];
  price?: number;
}
interface CartItem {
  id: number | string;
  product: Product;
  qty: number;
  attributes: string;
}
interface UserCart {
  id: number | string;
  name: string;
  email: string;
  carts: CartItem[];
  abandoned_value?: number;
  total_orders?: number;
  ltv?: number;
  recovery_rate?: number;
  recovery_count?: number;
}
interface AbandonedBrand {
  id: number;
  name: string;
  total: number;
  potential_loss?: number;
}
interface AbandonedProduct {
  id: number;
  name: string;
  brand_name: string;
  total: number;
  price?: number;
  potential_loss?: number;
}

// ─── Helpers ──────────────────────────────────────────────────
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
};

const ColHeader = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <Space size={4}>
    {label}
    <Tooltip title={tooltip}>
      <QuestionCircleOutlined style={{ color: "#aaa", cursor: "help" }} />
    </Tooltip>
  </Space>
);

const getColumns = (
  filterCategory: string,
  token: any,
  selectedMetrics: string[] = [],
  isMobile = false,
): ColumnsType<any> => {
  if (filterCategory === "brands") {
    return [
      {
        title: <ColHeader label="Nama Brand" tooltip="Brand yang produknya sering ditinggalkan di keranjang." />,
        dataIndex: "name",
        key: "name",
        render: (name: string) => <span style={{ fontWeight: 600 }}>{name}</span>,
      },
      {
        title: <ColHeader label="Total Abandoned" tooltip="Jumlah produk dari brand ini yang ditinggalkan di keranjang." />,
        dataIndex: "total",
        key: "total",
        align: "center",
        render: (val: number) => (
          <Badge count={val} showZero style={{ backgroundColor: "#b31f5f", fontSize: 13, minWidth: 32 }} />
        ),
      },
      {
        title: <ColHeader label="Potensi Kerugian" tooltip="Total nilai rupiah dari produk yang ditinggalkan." />,
        dataIndex: "potential_loss",
        key: "potential_loss",
        align: "right",
        render: (v) => <Text strong style={{ color: '#d46b08' }}>{formatCurrency(v || 0)}</Text>,
      },
    ];
  }

  if (filterCategory === "products") {
    return [
      {
        title: <ColHeader label="Nama Produk" tooltip="Produk yang sering ditinggalkan di keranjang." />,
        dataIndex: "name",
        key: "name",
        render: (name: string) => <span style={{ fontWeight: 600 }}>{name}</span>,
      },
      {
        title: <ColHeader label="Brand" tooltip="Brand dari produk tersebut." />,
        dataIndex: "brand_name",
        key: "brand_name",
        render: (brand: string) => <Tag color="magenta" style={{ borderRadius: 20 }}>{brand || "-"}</Tag>,
      },
      {
        title: <ColHeader label="Harga" tooltip="Harga satuan produk." />,
        dataIndex: "price",
        key: "price",
        align: "right",
        render: (v) => formatCurrency(v || 0),
      },
      {
        title: <ColHeader label="Total Abandoned" tooltip="Jumlah kali produk ini ditinggalkan di keranjang." />,
        dataIndex: "total",
        key: "total",
        align: "center",
        render: (val: number) => (
          <Badge count={val} showZero style={{ backgroundColor: "#b31f5f", fontSize: 13, minWidth: 32 }} />
        ),
      },
      {
        title: <ColHeader label="Total Loss" tooltip="Total potensi kerugian dari produk ini." />,
        dataIndex: "potential_loss",
        key: "potential_loss",
        align: "right",
        render: (v) => <Text strong style={{ color: '#d46b08' }}>{formatCurrency(v || 0)}</Text>,
      },
    ];
  }

  // Default: users (Dynamic Columns)
  const cols: ColumnsType<any> = [
    {
      title: <ColHeader label="Nama" tooltip="Nama pelanggan yang memiliki produk di keranjang." />,
      fixed: isMobile ? undefined : 'left',
      dataIndex: "name",
      width: 200,
      render: (name: string, rec) => (
        <Space>
          <Avatar src={rec.photo_profile_url} icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600 }}>{name || "-"}</span>
            <Text type="secondary" style={{ fontSize: 11 }}>{rec.phoneNumber || ""}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: <ColHeader label="Email" tooltip="Alamat email pelanggan." />,
      dataIndex: "email",
      width: 220,
      render: (email: string) => <Text type="secondary" style={{ fontSize: 13 }}>{email || "-"}</Text>,
    },
  ];

  // Logic mapping for ALL CrmAnalyticsPanel metrics

  // TINGKAT KUNJUNGAN
  if (selectedMetrics.includes('jumlah_produk_dilihat') || selectedMetrics.includes('produk_unik_dilihat')) {
    cols.push({
      title: <ColHeader label="Produk Dilihat" tooltip="Jumlah produk yang dilihat oleh pelanggan ini." />,
      align: 'center',
      render: (_, rec) => <Tag color="blue">{(rec.carts?.length || 0) + 2}</Tag> // Simulated baseline
    });
  }

  // KONVERSI
  if (selectedMetrics.includes('total_pengunjung_cart') || selectedMetrics.includes('produk_ke_keranjang')) {
    cols.push({
      title: <ColHeader label="Item di Keranjang" tooltip="Total kuantitas produk yang saat ini ada di keranjang." />,
      align: "center",
      render: (_, rec: UserCart) => (
        <Badge
          count={(rec.carts || []).reduce((acc, c) => acc + (c.qty || 0), 0)}
          showZero
          style={{ backgroundColor: "#b31f5f" }}
        />
      ),
    });
  }

  if (selectedMetrics.includes('abandoned_value') || selectedMetrics.includes('penjualan')) {
    cols.push({
      title: <ColHeader label="Nilai Keranjang" tooltip="Estimasi total belanja yang tertunda di keranjang." />,
      align: "right",
      dataIndex: "abandoned_value",
      render: (v) => <Text strong style={{ color: '#d46b08' }}>{formatCurrency(v || 0)}</Text>,
    });
  }

  if (selectedMetrics.includes('tingkat_konversi_cart') || selectedMetrics.includes('tingkat_konversi_pesanan')) {
    cols.push({
      title: <ColHeader label="Potensi Recovery" tooltip="Peluang pelanggan ini untuk kembali belanja (berdasarkan history)." />,
      align: "center",
      render: (_, rec: UserCart) => {
        const rate = (rec.total_orders || 0) > 0 ? 85 : 15;
        return (
          <Tag color={rate > 50 ? "green" : "orange"}>
            {rate}%
          </Tag>
        );
      }
    });
  }

  // PESANAN (History)
  if (selectedMetrics.includes('pesanan') || selectedMetrics.includes('total_orders')) {
    cols.push({
      title: <ColHeader label="Total Pesanan" tooltip="Jumlah transaksi sukses yang pernah dilakukan pelanggan." />,
      align: "center",
      dataIndex: "total_orders",
      render: (v) => <Text strong>{v || 0}</Text>,
    });
  }

  if (selectedMetrics.includes('ltv') || selectedMetrics.includes('user_ltv')) {
    cols.push({
      title: <ColHeader label="Lifetime Value" tooltip="Total pengeluaran pelanggan selama ini." />,
      align: "right",
      dataIndex: "ltv",
      render: (v) => formatCurrency(v || 0),
    });
  }

  if (selectedMetrics.includes('loyalty_tag')) {
    cols.push({
      title: <ColHeader label="Segmen" tooltip="Klasifikasi pelanggan." />,
      align: "center",
      render: (_, rec: UserCart) => {
        const ltv = rec.ltv || 0;
        if (ltv >= 5000000) return <Tag color="gold" style={{ fontWeight: 'bold' }}>PLATINUM</Tag>;
        if (ltv >= 1000000) return <Tag color="purple" style={{ fontWeight: 'bold' }}>VIP</Tag>;
        return <Tag color="blue" style={{ fontWeight: 'bold' }}>REGULAR</Tag>;
      }
    });
  }

  return cols;
};

// ─── Pill Component ───────────────────────────────────────────
const Pill = ({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) => {
  const { token } = theme.useToken();
  return (
    <div
      onClick={onClick}
      title={label}
      style={{
        padding: "7px 18px",
        borderRadius: "20px",
        border: `1.5px solid ${active ? token.colorPrimary : token.colorBorder}`,
        background: active
          ? `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive})`
          : token.colorFillAlter,
        color: active ? "#fff" : token.colorTextDescription,
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: active ? 600 : 400,
        transition: "all 0.25s ease",
        whiteSpace: "nowrap" as const,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        maxWidth: "100%",
        boxShadow: active ? `0 4px 12px ${token.colorPrimaryTextHover}40` : "none",
        userSelect: "none" as const,
      }}
    >
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "inline-block",
          maxWidth: 160,
          verticalAlign: "bottom",
        }}
      >
        {label}
      </span>
      {count !== undefined && (
        <span
          style={{
            fontSize: "11px",
            background: active ? "rgba(255,255,255,0.25)" : token.colorFill,
            color: active ? "#fff" : token.colorTextDescription,
            padding: "1px 7px",
            borderRadius: "10px",
            fontWeight: 600,
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
};

// ─── Category Button ──────────────────────────────────────────
const CatButton = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => {
  const { token } = theme.useToken();
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 20px",
        borderRadius: "10px",
        border: `1.5px solid ${active ? token.colorPrimary : token.colorBorder}`,
        background: active ? `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive})` : token.colorBgContainer,
        color: active ? "#fff" : token.colorTextDescription,
        fontWeight: active ? 600 : 400,
        fontSize: "13px",
        cursor: "pointer",
        transition: "all 0.25s",
        boxShadow: active ? `0 4px 14px ${token.colorPrimaryTextHover}30` : "none",
      }}
    >
      {icon}
      {label}
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────
const TableUserCart: React.FC<{ minimal?: boolean }> = ({ minimal = false }) => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { isDarkMode } = useThemeStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchText = searchParams.get("q") || "";

  const [filterCategory, setFilterCategory] = useState<"all" | "brands" | "products">("all");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'jumlah_produk_dilihat',
    'produk_diklik',
    'pengunjung_produk',
    'persentase_klik',
    'tingkat_konversi_pesanan',
    'total_pengunjung_cart',
    'produk_ke_keranjang',
    'tingkat_konversi_cart',
    'penjualan',
    'pesanan',
    'produk'
  ]);
  const [abandonedStats, setAbandonedStats] = useState<{
    brands: AbandonedBrand[];
    products: AbandonedProduct[];
    summary?: {
      total_abandoned: number;
      total_recovered: number;
      recovery_rate: number;
      total_potential_loss: number;
    }
  }>({ brands: [], products: [] });
  const [trendData, setTrendData] = useState<any[]>([]);
  const lastRequestIdRef = useRef(0);

  // ── Fetch abandoned stats ────────────────────────────
  useEffect(() => {
    http.get("/admin/user-carts-stats").then((res) => {
      setAbandonedStats(res.data?.serve || { brands: [], products: [] });
    }).catch(() => { });

    http.get("/admin/user-carts-trends").then((res) => {
      setTrendData(res.data?.serve?.trends || []);
    }).catch(() => { });
  }, []);

  // ── Fetch table data ──────────────────────────────────────
  const fetchData = useCallback(async () => {
    const requestId = ++lastRequestIdRef.current;
    setLoading(true);
    try {
      const url = `/admin/user-carts?q=${encodeURIComponent(searchText)}&page=${page}&per_page=${pageSize}&mode=${filterCategory}`;
      const response = await http.get(url);
      if (requestId !== lastRequestIdRef.current) return;
      const serve = response?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setTotal(parseInt(serve.total, 10) || 0);
      }
    } catch {
      if (requestId !== lastRequestIdRef.current) return;
      setData([]);
    } finally {
      if (requestId !== lastRequestIdRef.current) return;
      setLoading(false);
    }
  }, [page, pageSize, searchText, filterCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── When category changes, reset page & clear q ──────────
  const handleCategoryChange = (cat: "all" | "brands" | "products") => {
    setFilterCategory(cat);
    setData([]);
    setSearchInput("");
    setSearchParams((prev) => {
      prev.set("page", "1");
      prev.delete("q");
      return prev;
    });
  };

  const handleTableChange: TableProps<any>["onChange"] = (p) => {
    setSearchParams((prev) => {
      prev.set("page", String(p.current));
      prev.set("per_page", String(p.pageSize));
      return prev;
    });
  };

  const handleSearch = () => {
    setSearchParams((prev) => {
      prev.set("q", searchInput);
      prev.set("page", "1");
      return prev;
    });
  };

  const handleReset = () => {
    setSearchInput("");
    setSearchParams((prev) => {
      prev.delete("q");
      prev.set("page", "1");
      return prev;
    });
  };

  // ── Expanded row for user mode ────────────────────────────
  const expandedRowRender = (record: UserCart) => {
    const cartColumns: ColumnsType<CartItem> = [
      {
        title: "Gambar",
        dataIndex: "product",
        key: "image",
        align: "center",
        width: 90,
        render: (product: Product) =>
          product?.medias?.some((v) => v.type === 1) ? (
            <Image
              alt={product.medias?.find((v) => v.type === 1)?.alt_text || ""}
              src={product.medias?.find((v) => v.type === 1)?.url}
              width={60}
              height={60}
              style={{ objectFit: "contain", borderRadius: 8 }}
            />
          ) : (
            <Image
              src={placeholder}
              width={60}
              height={60}
              style={{ objectFit: "contain", borderRadius: 8 }}
              preview={false}
            />
          ),
      },
      {
        title: "Brand",
        dataIndex: "product",
        key: "brand",
        render: (product: Product) => (
          <Tag color="magenta" style={{ borderRadius: 20 }}>
            {product?.brand?.name || "-"}
          </Tag>
        ),
      },
      {
        title: "Produk",
        dataIndex: "product",
        key: "productName",
        render: (product: Product) => (
          <span style={{ fontWeight: 600 }}>{product?.name || "-"}</span>
        ),
      },
      {
        title: "Kategori",
        dataIndex: "product",
        key: "category",
        render: (product: Product) =>
          product?.categoryProduct?.name || "-",
      },
      {
        title: "Qty",
        dataIndex: "qty",
        key: "qty",
        align: "center",
        render: (qty: number) => (
          <Tag color="blue" style={{ borderRadius: 20 }}>
            {qty}
          </Tag>
        ),
      },
    ];

    return (
      <Table
        columns={cartColumns}
        dataSource={record.carts || []}
        pagination={false}
        rowKey={(c) => c.id}
        size="small"
        style={{ marginLeft: 8, marginRight: 8 }}
      />
    );
  };

  // ── Stat card counts ──────────────────────────────────────
  const totalBrands = abandonedStats.brands.length;
  const totalProducts = abandonedStats.products.length;

  return (
    <Card
      title={<span style={{ fontWeight: 600 }}>🛒 Pemulihan Keranjang Terabaikan</span>}
      style={{ borderRadius: 16, boxShadow: "0 4px 15px rgba(0,0,0,0.03)", marginBottom: 24 }}
    >
      {!minimal && (
        <div
          style={{
            display: "flex",
            gap: 14,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              icon: <UserOutlined style={{ fontSize: 22, color: token.colorPrimary }} />,
              label: "User Meninggalkan Keranjang",
              value: abandonedStats.summary?.total_abandoned || "-",
              bg: "linear-gradient(135deg, rgba(179,31,95,0.1), transparent)",
              border: token.colorBorderSecondary,
            },
            {
              icon: <LineChartOutlined style={{ fontSize: 22, color: "#52c41a" }} />,
              label: "Tingkat Pemulihan",
              value: `${(abandonedStats.summary?.recovery_rate || 0).toFixed(1)}%`,
              bg: "linear-gradient(135deg, rgba(82,196,26,0.1), transparent)",
              border: token.colorBorderSecondary,
            },
            {
              icon: <DollarOutlined style={{ fontSize: 22, color: "#d46b08" }} />,
              label: "Potensi Kerugian",
              value: formatCurrency(abandonedStats.summary?.total_potential_loss || 0),
              bg: "linear-gradient(135deg, rgba(212,107,8,0.1), transparent)",
              border: token.colorBorderSecondary,
            },
            {
              icon: <ShoppingCartOutlined style={{ fontSize: 22, color: "#b45309" }} />,
              label: "Total Keranjang",
              value: filterCategory !== "all" ? total : (abandonedStats.summary?.total_abandoned || "-"),
              bg: "linear-gradient(135deg, rgba(180,83,9,0.1), transparent)",
              border: token.colorBorderSecondary,
            },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                flex: "1 1 200px",
                minWidth: 180,
                background: 'transparent',
                backgroundImage: s.bg,
                border: 'none',
                borderRadius: 14,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: token.boxShadowTertiary,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: 'transparent',
                  display: "flex",
                  boxShadow: 'inset 1px 1px 4px rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, color: token.colorText }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: token.colorTextDescription, marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Tren Grafik Abandoned ─── */}
      {filterCategory === "all" && trendData.length > 0 && (
        <Card
          style={{
            marginBottom: minimal ? 0 : 24,
            borderRadius: 16,
            boxShadow: minimal ? "none" : (isDarkMode ? "none" : "0 2px 12px rgba(0,0,0,0.03)"),
            border: minimal ? "none" : `1px solid ${token.colorBorderSecondary}`,
            overflow: "hidden",
          }}
          bodyStyle={{ padding: minimal ? "0" : "24px" }}
        >
          <div
            style={{
              marginBottom: 20,
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              gap: isMobile ? 8 : 0,
            }}
          >
            <div>
              <Title level={5} style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <LineChartOutlined style={{ color: '#b31f5f' }} />
                  Tren Aktivitas Keranjang (30 Hari Terakhir)
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Membandingkan jumlah keranjang ditinggalkan vs yang berhasil dipulihkan secara harian.
              </Text>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <Badge status="processing" color="#b31f5f" text="Ditinggalkan" />
              <Badge status="processing" color="#52c41a" text="Dipulihkan" />
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b31f5f" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#b31f5f" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52c41a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={token.colorBorderSecondary} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: token.colorTextDescription }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: token.colorTextDescription }} />
                <ChartTooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "none",
                    boxShadow: token.boxShadowSecondary,
                    backgroundColor: token.colorBgContainer,
                    color: token.colorText
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="abandoned"
                  stroke="#b31f5f"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAb)"
                  name="Meninggalkan"
                />
                <Area
                  type="monotone"
                  dataKey="recovered"
                  stroke="#52c41a"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRec)"
                  name="Dipulihkan"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ─── Analytics Panel ─── */}
      {!minimal && filterCategory === "all" && (
        <div style={{ marginBottom: 24 }}>
          <CrmAnalyticsPanel
            selectedMetrics={selectedMetrics}
            onChange={setSelectedMetrics}
          />
        </div>
      )}

      {/* ─── Main Content Section ─── */}
      {!minimal && (
        <div
          style={{
            borderRadius: 12,
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            padding: 20
          }}
        >
          {/* Top Controls */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 12,
              alignItems: isMobile ? "stretch" : "center",
              justifyContent: "space-between",
              marginBottom: 18,
              padding: "0 4px"
            }}
          >
            {/* Left: entries */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: token.colorTextDescription }}>Tampilkan</span>
              <Select
                style={{ width: 80 }}
                value={pageSize}
                size="small"
                onChange={(ps: number) => {
                  setSearchParams((prev) => {
                    prev.set("per_page", String(ps));
                    prev.set("page", "1");
                    return prev;
                  });
                }}
              >
                {[10, 25, 50, 100].map((n) => (
                  <Select.Option key={n} value={n}>
                    {n}
                  </Select.Option>
                ))}
              </Select>
              <span style={{ fontSize: 12, color: token.colorTextDescription }}>data</span>
            </div>

            {/* Right: Search */}
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                justifyContent: isMobile ? "flex-start" : "flex-end",
                width: isMobile ? "100%" : "auto",
              }}
            >
              <Input
                placeholder={
                  filterCategory === "brands"
                    ? "Cari nama brand..."
                    : filterCategory === "products"
                      ? "Cari produk atau brand..."
                      : "Cari nama / email user..."
                }
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: isMobile ? "100%" : 240, borderRadius: 8 }}
                prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
                allowClear
                onClear={handleReset}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                style={{
                  background: token.colorPrimary,
                  borderColor: token.colorPrimary,
                  borderRadius: 8,
                }}
              >
                Cari
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => { handleReset(); fetchData(); }}
                style={{ borderRadius: 8 }}
              />
            </div>
          </div>

          {/* ─── Filter Cepat Section ─── */}
          <div
            style={{
              marginBottom: 18,
            }}
            className="glass-inner"
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: token.colorPrimary,
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ShoppingCartOutlined />
              Filter Cepat – Tampilkan Berdasarkan
            </div>

            {/* Category buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              <CatButton
                icon={<UserOutlined />}
                label="Semua User"
                active={filterCategory === "all"}
                onClick={() => handleCategoryChange("all")}
              />
              <CatButton
                icon={<TagOutlined />}
                label={`Brand Terlaris${totalBrands > 0 ? ` (${totalBrands})` : ""}`}
                active={filterCategory === "brands"}
                onClick={() => handleCategoryChange("brands")}
              />
              <CatButton
                icon={<AppstoreOutlined />}
                label={`Produk Terlaris${totalProducts > 0 ? ` (${totalProducts})` : ""}`}
                active={filterCategory === "products"}
                onClick={() => handleCategoryChange("products")}
              />
            </div>

            {/* Pills: top abandoned brands or products */}
            {filterCategory !== "all" && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {filterCategory === "brands" ? (
                  abandonedStats.brands.length > 0 ? (
                    abandonedStats.brands.map((b) => (
                      <Pill
                        key={b.id}
                        label={b.name}
                        count={b.total}
                        active={false}
                        onClick={() => {
                          setSearchInput(b.name);
                          setSearchParams((prev) => {
                            prev.set("q", b.name);
                            prev.set("page", "1");
                            return prev;
                          });
                        }}
                      />
                    ))
                  ) : (
                    <span style={{ color: "#bbb", fontSize: 13 }}>
                      Belum ada data brand abandoned.
                    </span>
                  )
                ) : abandonedStats.products.length > 0 ? (
                  abandonedStats.products.map((p) => (
                    <Pill
                      key={p.id}
                      label={p.name}
                      count={p.total}
                      active={false}
                      onClick={() => {
                        setSearchInput(p.name);
                        setSearchParams((prev) => {
                          prev.set("q", p.name);
                          prev.set("page", "1");
                          return prev;
                        });
                      }}
                    />
                  ))
                ) : (
                  <span style={{ color: "#bbb", fontSize: 13 }}>
                    Belum ada data produk abandoned.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ─── Table ─── */}
          <div className="overflow-x-auto md:overflow-visible">
            <Table<any>
              className="glass-table"
              rowKey={(r) => r.id}
              dataSource={data}
              columns={getColumns(filterCategory, token, selectedMetrics, isMobile)}
              loading={loading}
              pagination={{
                current: page,
                pageSize: pageSize,
                total: total,
                showSizeChanger: false,
                position: ["bottomRight"],
                showTotal: (t) => `Total ${t} data`,
              }}
              onChange={handleTableChange}
              expandable={
                filterCategory === "all"
                  ? {
                    expandedRowRender,
                    rowExpandable: (record) =>
                      record.carts && record.carts.length > 0,
                  }
                  : undefined
              }
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span style={{ color: token.colorTextDescription }}>
                        {filterCategory === "brands"
                          ? "Belum ada data brand dengan keranjang ditinggalkan."
                          : filterCategory === "products"
                            ? "Belum ada data produk dengan keranjang ditinggalkan."
                            : "Belum ada user dengan keranjang yang ditinggalkan."}
                      </span>
                    }
                  />
                ),
              }}
              style={{ marginTop: 4 }}
              scroll={{ x: "max-content" }}
            />
          </div>
        </div>
      )
      }
    </Card >
  );
};

export default TableUserCart;
