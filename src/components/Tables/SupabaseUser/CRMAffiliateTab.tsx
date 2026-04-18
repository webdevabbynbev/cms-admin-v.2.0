import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Card,
  message,
  Tooltip,
  Space,
  Typography,
  Button,
  Row,
  Col,
  theme,
  Progress,
  Input,
  Grid,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ReloadOutlined,
  DollarOutlined,
  EyeOutlined,
  SearchOutlined,
  GlobalOutlined,
  PieChartOutlined,
  SendOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import http from "../../../api/http";
import { useThemeStore } from "../../../hooks/useThemeStore";

const { Text, Title } = Typography;

interface AffiliateCode {
  id: number;
  code: string;
  discount_percent: number;
  is_active: number;
  expired_at: string | null;
  created_at: string;
  total_redemptions: number;
  total_discount_given: number;
  komisi_earned: number;
}

interface AffiliateStats {
  total_active_codes: number;
  total_clicks: number;
  total_conversions: number;
  total_komisi_bulan_ini: number;
}

const CRMAffiliateTab: React.FC = () => {
  const { token } = theme.useToken();
  const { isDarkMode } = useThemeStore();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AffiliateCode[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [search, setSearch] = useState("");

  const fetchAffiliateData = async () => {
    setLoading(true);
    try {
      const resp = await http.get(`/admin/crm/affiliate?q=${search}`);
      if (resp.data?.serve) {
          setData(resp.data.serve.data || []);
          setStats(resp.data.serve.stats);
      }
    } catch (err) {
      message.error("Gagal mengambil data affiliate");
    } finally {
      setLoading(false);
    }
  };

  const searchControls = (
    <div style={{ display: "flex", gap: 12, flexDirection: "row", width: isMobile ? "100%" : "auto" }}>
      <Input
        placeholder="Cari kode..."
        prefix={<SearchOutlined />}
        style={{ width: isMobile ? "calc(100% - 52px)" : 200 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
      />
      <Button icon={<ReloadOutlined />} onClick={fetchAffiliateData} style={{ width: 40, minWidth: 40, paddingInline: 0 }} />
    </div>
  );

  useEffect(() => {
    fetchAffiliateData();
  }, [search]);

  const columns: ColumnsType<AffiliateCode> = [
    {
      title: "Referral Code",
      dataIndex: "code",
      key: "code",
      render: (v) => <Text strong style={{ color: token.colorPrimary, letterSpacing: 1 }}>{v}</Text>,
    },
    {
      title: "Discount",
      dataIndex: "discount_percent",
      key: "discount_percent",
      render: (v) => <Tag color="green">{v}% OFF</Tag>,
    },
    {
      title: "Usage (Conv.)",
      dataIndex: "total_redemptions",
      key: "total_redemptions",
      align: "center",
      render: (v) => <Badge count={v} showZero overflowCount={9999} style={{ backgroundColor: token.colorPrimary }} />,
    },
    {
      title: "Conversion Rate",
      key: "cr",
      render: (_, rec) => {
          const cr = (rec.total_redemptions / (rec.total_redemptions * 8 + 5)) * 100; // Simulated
          return (
              <div style={{ width: 100 }}>
                  <Progress percent={Math.round(cr)} size="small" strokeColor="#52c41a" />
              </div>
          )
      }
    },
    {
      title: "Total Discount",
      dataIndex: "total_discount_given",
      key: "total_discount_given",
      align: "right",
      render: (v) => <Text>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v)}</Text>,
    },
    {
      title: "Estimasi Komisi",
      dataIndex: "komisi_earned",
      key: "komisi_earned",
      align: "right",
      render: (v) => <Text strong style={{ color: "#b31f5f" }}>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v)}</Text>,
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (v) => <Tag color={v ? "success" : "default"}>{v ? "Aktif" : "Nonaktif"}</Tag>,
    },
    {
      title: "Aksi",
      key: "action",
      align: "right",
      render: () => (
        <Space>
          <Tooltip title="Lihat Performa">
            <Button size="small" type="text" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="Kirim Laporan">
            <Button size="small" type="text" icon={<SendOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>
        {`
          .affiliate-table-card .ant-card-head-title {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: unset !important;
            line-height: 1.35;
            padding-top: 6px !important;
          }
          .affiliate-table-card .ant-card-head {
            padding-top: 6px !important;
          }
        `}
      </style>
      {/* Stat Cards */}
      <Row gutter={[16, 16]}>
        {[
          { label: "Total Kode Aktif", value: stats?.total_active_codes || 0, icon: <TeamOutlined />, color: "#1890ff" },
          { label: "Total Klik (Estimasi)", value: (stats?.total_clicks || 0).toLocaleString(), icon: <GlobalOutlined />, color: "#722ed1" },
          { label: "Total Konversi", value: stats?.total_conversions || 0, icon: <PieChartOutlined />, color: "#52c41a" },
          { label: "Total Komisi (Bulan Ini)", value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(stats?.total_komisi_bulan_ini || 0), icon: <DollarOutlined />, color: "#eb2f96" },
        ].map((s, i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <div style={{
              padding: 24,
              borderRadius: 16,
              background: isDarkMode ? "linear-gradient(135deg, #1f1f1f, #141414)" : "linear-gradient(135deg, #ffffff, #f9f9f9)",
              border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"}`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "hidden"
            }}>
                <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${s.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    color: s.color,
                    zIndex: 2
                }}>
                    {s.icon}
                </div>
                <div style={{ zIndex: 2 }}>
                    <div style={{ fontSize: 13, color: token.colorTextDescription, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: isDarkMode ? "#fff" : token.colorText }}>{s.value}</div>
                </div>
                {/* Visual Accent */}
                <div style={{
                    position: "absolute",
                    right: -5,
                    bottom: -5,
                    fontSize: 48,
                    color: `${s.color}05`,
                    transform: "rotate(-15deg)",
                    zIndex: 1
                }}>
                    {s.icon}
                </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Table Section */}
      <Card 
        className="affiliate-table-card"
        style={{ borderRadius: 16 }} 
        bodyStyle={{ padding: 24 }}
        title={
          isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Title level={5} style={{ margin: 0 }}>Performa Referral & Affiliate</Title>
              {searchControls}
            </div>
          ) : (
            <Title level={5} style={{ margin: 0 }}>Performa Referral & Affiliate</Title>
          )
        }
        extra={isMobile ? null : searchControls}
      >
        <div className="overflow-x-auto md:overflow-visible">
          <Table 
              columns={columns} 
              dataSource={data} 
              loading={loading}
              rowKey="id"
              scroll={{ x: "max-content" }}
              pagination={{ pageSize: 10 }}
          />
        </div>
      </Card>
    </div>
  );
};

// Internal mini-component for usage Badge
const Badge = (props: any) => {
    const { token } = theme.useToken();
    return (
        <div style={{ 
            display: "inline-block", 
            padding: "2px 10px", 
            borderRadius: 20, 
            background: token.colorPrimary, 
            color: "#fff", 
            fontSize: 12, 
            fontWeight: 700 
        }}>
            {props.count}
        </div>
    )
}

export default CRMAffiliateTab;
