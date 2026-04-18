import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Tag,
  Card,
  message,
  Tooltip,
  Space,
  Avatar,
  Typography,
  Input,
  Select,
  Button,
  Row,
  Col,
  theme,
  Progress,
  Modal,
  Form,
  Drawer,
  Descriptions,
  Divider,
  DatePicker,
  Grid,
} from "antd";
const { RangePicker } = DatePicker;
import type { ColumnsType } from "antd/es/table";
import {
  QuestionCircleOutlined,
  UserOutlined,
  ReloadOutlined,
  LineChartOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  MailOutlined,
  WhatsAppOutlined,
  EyeOutlined,
  GiftOutlined,
  NodeIndexOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  StopOutlined,
  UsergroupAddOutlined,
  FireOutlined,
} from "@ant-design/icons";
import http from "../../../api/http";
import { getVoucherList } from "../../../api/voucher";
import { useSearchParams } from "react-router-dom";
import { useThemeStore } from "../../../hooks/useThemeStore";

const { Text, Title } = Typography;

// --- Interfaces ---
interface CrmMember {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  photo_profile_url?: string | null;
  is_active: number;
  emailVerified: number | null;
  createdAt: string;
  crm_tier: string;
  referral_code: string | null;
  total_orders: number;
  ltv: number;
  profile_m1?: number; // Simulated Profile Completion %
  points_m2?: number;  // Simulated Points
  badge_active?: string; // Simulated Badge (Bronze, Silver, Gold, Legend)
  section?: string;    // Simulated Section (Abby's / Bev's)
  platform?: string;   // Simulated Platform (Web / App)
}

interface CrmStats {
  total_member: number;
  abeauties: number;
  abmua: number;
  abcd: number;
  customer: number;
  total_revenue: number;
  belum_aktif: number;
  avg_revenue_per_order: number;
  tier_distribution: Record<string, number>;
}

// --- Constants ---
const TIER_CONFIG: Record<string, { color: string; label: string }> = {
  Customer: { color: "blue", label: "Customer" },
  ABeauties: { color: "magenta", label: "ABeauties" },
  ABMUA: { color: "purple", label: "ABMUA" },
  ABCD: { color: "gold", label: "ABCD/KOL" },
};

const BADGE_CONFIG: Record<string, { color: string; bgColor: string }> = {
  Bronze: { color: "#8a5a44", bgColor: "#f3edea" },
  Silver: { color: "#5a5a5a", bgColor: "#f0f0f0" },
  Gold: { color: "#b8860b", bgColor: "#fcf8e3" },
  Legend: { color: "#a52a2a", bgColor: "#f9ebeb" },
};

// --- Components ---
const ColHeader = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <Space size={4}>
    {label}
    <Tooltip title={tooltip}>
      <QuestionCircleOutlined style={{ color: "#aaa", cursor: "help", fontSize: 12 }} />
    </Tooltip>
  </Space>
);

const CRMMemberTab: React.FC = () => {
  const { token } = theme.useToken();
  const { isDarkMode } = useThemeStore();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<CrmMember[]>([]);
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Modals/Drawers state
  const [isTierModalVisible, setIsTierModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isVoucherModalVisible, setIsVoucherModalVisible] = useState(false);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<CrmMember | null>(null);
  const [form] = Form.useForm();
  const [voucherForm] = Form.useForm();

  const formatWhatsAppNumber = (phone: string | null) => {
    if (!phone) return "";
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.substring(1);
    }
    if (cleaned.startsWith("8")) {
      cleaned = "62" + cleaned;
    }
    return cleaned;
  };

  const fetchVouchers = async () => {
    try {
      const resp = await getVoucherList({ per_page: 100 });
      if (resp.data?.serve?.data) {
        setVouchers(resp.data.serve.data);
      } else if (Array.isArray(resp.data?.serve)) {
        setVouchers(resp.data.serve);
      }
    } catch (err) {
      
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const q = searchParams.get("q") || "";
      const tier = searchParams.get("tier") || "";
      const status = searchParams.get("status") || "";
      const section = searchParams.get("section") || "";
      const dateFrom = searchParams.get("date_from") || "";
      const dateTo = searchParams.get("date_to") || "";
      const pointsMin = searchParams.get("points_min") || "";
      const pointsMax = searchParams.get("points_max") || "";
      const profileMin = searchParams.get("profile_min") || "";
      const profileMax = searchParams.get("profile_max") || "";
      const trxMin = searchParams.get("transactions_min") || "";
      const trxMax = searchParams.get("transactions_max") || "";
      
      let queryStr = `page=${page}&per_page=${pageSize}&q=${encodeURIComponent(q)}&tier=${tier}&status=${status}`;
      if (section) queryStr += `&section=${encodeURIComponent(section)}`;
      if (dateFrom) queryStr += `&date_from=${dateFrom}`;
      if (dateTo) queryStr += `&date_to=${dateTo}`;
      if (pointsMin) queryStr += `&points_min=${pointsMin}`;
      if (pointsMax) queryStr += `&points_max=${pointsMax}`;
      if (profileMin) queryStr += `&profile_min=${profileMin}`;
      if (profileMax) queryStr += `&profile_max=${profileMax}`;
      if (trxMin) queryStr += `&transactions_min=${trxMin}`;
      if (trxMax) queryStr += `&transactions_max=${trxMax}`;

      const [listResp, statsResp] = await Promise.all([
        http.get(`/admin/crm/members?${queryStr}`),
        http.get(`/admin/crm/member-stats`)
      ]);

      if (listResp.data?.serve) {
        setData(listResp.data.serve.data || []);
        setTotal(listResp.data.serve.total || 0);
      }

      if (statsResp.data?.serve) {
        setStats(statsResp.data.serve);
      }
    } catch (err) {
      
      message.error("Gagal mengambil data member CRM");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVoucherGive = async (values: any) => {
    if (!selectedMember) return;
    try {
      await http.post(`/admin/crm/members/${selectedMember.id}/give-voucher`, {
        voucher_id: values.voucher_id,
      });
      message.success(`Voucher berhasil diberikan kepada ${selectedMember.name}`);
      setIsVoucherModalVisible(false);
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Gagal memberikan voucher");
    }
  };

  const handleTierUpdate = async (values: any) => {
    if (!selectedMember) return;
    try {
      await http.patch(`/admin/crm/members/${selectedMember.id}/tier`, { tier: values.tier });
      message.success(`Tier ${selectedMember.name} berhasil diubah menjadi ${values.tier}`);
      setIsTierModalVisible(false);
      fetchData();
    } catch (err) {
      message.error("Gagal mengubah tier member");
    }
  };

  const columns: ColumnsType<CrmMember> = [
    {
      title: <ColHeader label="Member" tooltip="Nama dan email member." />,
      key: "name",
      width: 220,
      fixed: isMobile ? undefined : "left",
      render: (_, rec) => (
        <Space>
          <Avatar src={rec.photo_profile_url} icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Space size={4}>
                <Text strong style={{ fontSize: 13 }}>{rec.name || "-"}</Text>
                {rec.emailVerified ? <Tooltip title="Email Terverifikasi"><CheckCircleOutlined style={{ color: "#52c41a", fontSize: 12 }} /></Tooltip> : null}
            </Space>
            <Text type="secondary" style={{ fontSize: 11 }}>{rec.email || "-"}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: <ColHeader label="Tier Ver 2.0" tooltip="Level keanggotaan saat ini." />,
      dataIndex: "crm_tier",
      key: "crm_tier",
      align: "center",
      render: (tier: string) => {
        const config = TIER_CONFIG[tier] || TIER_CONFIG.Customer;
        return <Tag color={config.color} style={{ fontWeight: 600, borderRadius: 12, padding: "0 10px" }}>{config.label.toUpperCase()}</Tag>;
      },
    },
    {
      title: <ColHeader label="Section" tooltip="Kategorisasi brand favorit." />,
      dataIndex: "section",
      key: "section",
      align: "center",
      render: (v) => <Tag color={v === "Abby's" ? "pink" : "blue"} bordered={false}>{v}</Tag>,
    },
    {
      title: <ColHeader label="Profil M1" tooltip="Persentase kelengkapan data diri." />,
      dataIndex: "profile_m1",
      key: "profile_m1",
      width: 120,
      render: (v) => <Progress percent={v} size="small" strokeColor={v >= 70 ? "#52c41a" : "#faad14"} />,
    },
    {
      title: <ColHeader label="Poin M2" tooltip="Akumulasi poin belanja." />,
      dataIndex: "points_m2",
      key: "points_m2",
      align: "right",
      render: (v) => <Text strong style={{ color: "#b31f5f" }}>{v?.toLocaleString("id-ID")}</Text>,
    },
    {
      title: <ColHeader label="Telepon" tooltip="Nomor WhatsApp member." />,
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: 140,
      render: (v) => <Text style={{ fontSize: 12 }}>{v || "-"}</Text>,
    },
    {
      title: <ColHeader label="Badge Aktif" tooltip="Status gamifikasi member." />,
      dataIndex: "badge_active",
      key: "badge_active",
      align: "center",
      render: (v) => {
          const config = BADGE_CONFIG[v || "Bronze"];
          return (
            <Tag 
                style={{ 
                    fontWeight: 600, 
                    color: config.color, 
                    backgroundColor: config.bgColor, 
                    border: `1px solid ${config.color}33`,
                    borderRadius: 12
                }}
            >
                {v}
            </Tag>
          );
      },
    },
    {
      title: <ColHeader label="Transaksi" tooltip="Jumlah pesanan sukses." />,
      dataIndex: "total_orders",
      key: "total_orders",
      align: "center",
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: <ColHeader label="Revenue" tooltip="Total nilai belanja (LTV)." />,
      dataIndex: "ltv",
      key: "ltv",
      align: "right",
      render: (v) => <Text strong>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v)}</Text>,
    },
    {
      title: <ColHeader label="Platform" tooltip="Akses terakhir dari." />,
      dataIndex: "platform",
      key: "platform",
      render: (v) => (
        <Space size={4}>
          <GlobalOutlined style={{ fontSize: 12 }} />
          <span style={{ fontSize: 12 }}>{v}</span>
        </Space>
      ),
    },
    {
      title: <ColHeader label="Status" tooltip="Status keaktifan akun." />,
      dataIndex: "is_active",
      key: "is_active",
      align: "center",
      render: (v) => <Tag color={v === 1 ? "success" : "default"} icon={v === 1 ? <CheckCircleOutlined /> : <StopOutlined />}>{v === 1 ? "Aktif" : "Belum Aktif"}</Tag>,
    },
    {
      title: "Aksi",
      key: "action",
      width: 165,
      align: "center",
      fixed: isMobile ? undefined : "right",
      render: (_, rec) => (
        <Space size={0} wrap={false}>
          <Tooltip title="Lihat Detail">
            <Button 
                size="small" 
                type="text" 
                style={{ width: 28, minWidth: 28, padding: 0 }}
                icon={<EyeOutlined style={{ color: "#1890ff" }} />} 
                onClick={() => {
                  setSelectedMember(rec);
                  setIsDetailVisible(true);
                }}
            />
          </Tooltip>
          <Tooltip title="Kirim WA">
            <Button 
                size="small" 
                type="text" 
                style={{ width: 28, minWidth: 28, padding: 0 }}
                icon={<WhatsAppOutlined style={{ color: "#25D366" }} />} 
                onClick={() => {
                  const num = formatWhatsAppNumber(rec.phoneNumber);
                  if (num) window.open(`https://wa.me/${num}`, "_blank");
                  else message.warning("Nomor telepon tidak tersedia");
                }}
            />
          </Tooltip>
          <Tooltip title="Kirim Email">
            <Button 
                size="small" 
                type="text" 
                style={{ width: 28, minWidth: 28, padding: 0 }}
                icon={<MailOutlined style={{ color: "#d44638" }} />} 
                onClick={() => {
                  if (rec.email) window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${rec.email}`, "_blank");
                  else message.warning("Email tidak tersedia");
                }}
            />
          </Tooltip>
          <Tooltip title="Beri Voucher">
            <Button 
              size="small" 
              type="text" 
              style={{ width: 28, minWidth: 28, padding: 0 }}
              icon={<GiftOutlined style={{ color: "#faad14" }} />} 
              onClick={() => {
                setSelectedMember(rec);
                voucherForm.resetFields();
                setIsVoucherModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Ubah Tier">
            <Button 
              size="small" 
              type="text" 
              style={{ width: 28, minWidth: 28, padding: 0 }}
              icon={<NodeIndexOutlined style={{ color: "#722ed1" }} />} 
              onClick={() => {
                setSelectedMember(rec);
                form.setFieldsValue({ tier: rec.crm_tier });
                setIsTierModalVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const statCards = [
    { icon: <UsergroupAddOutlined />, label: "Total Member", value: stats?.total_member || 0, color: token.colorPrimary },
    { icon: <FireOutlined />, label: "ABeauties Aktif", value: stats?.abeauties || 0, color: "#eb2f96" },
    { icon: <CheckCircleOutlined />, label: "ABMUA Verified", value: stats?.abmua || 0, color: "#722ed1" },
    { icon: <GlobalOutlined />, label: "KOL/ABCD Aktif", value: stats?.abcd || 0, color: "#faad14" },
    { icon: <DollarOutlined />, label: "Total Revenue", value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(stats?.total_revenue || 0), color: "#52c41a" },
    { icon: <StopOutlined />, label: "Belum Aktif", value: stats?.belum_aktif || 0, color: "#ff4d4f" },
    { icon: <LineChartOutlined />, label: "Avg Poin M2", value: "1.254", color: "#1890ff" },
    { icon: <ShoppingCartOutlined />, label: "Avg Revenue/Order", value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(stats?.avg_revenue_per_order || 0), color: "#fa8c16" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 8 Stat Cards */}
      <Row gutter={[16, 16]}>
        {statCards.map((s, i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <div style={{
              padding: 20,
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
                    color: s.color
                }}>
                    {s.icon}
                </div>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: isDarkMode ? "#fff" : token.colorText }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: token.colorTextDescription }}>{s.label}</div>
                </div>
                {/* Visual Accent */}
                <div style={{
                    position: "absolute",
                    right: -10,
                    bottom: -10,
                    fontSize: 60,
                    color: `${s.color}05`,
                    transform: "rotate(-15deg)"
                }}>
                    {s.icon}
                </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Tier Distribution Bar */}
      <Card 
        bodyStyle={{ padding: 20 }} 
        style={{ 
            borderRadius: 16, 
            background: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
            border: "none" 
        }}
      >
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <Title level={5} style={{ margin: 0, fontSize: 14 }}>Distribusi Tier Member</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>Total: {stats?.total_member || 0} Member</Text>
        </div>
        <div style={{ display: "flex", height: 32, borderRadius: 8, overflow: "hidden" }}>
            {Object.entries(TIER_CONFIG).map(([key, config]) => {
                const count = stats?.tier_distribution[key] || 0;
                const percent = stats?.total_member ? (count / stats.total_member) * 100 : 0;
                if (percent === 0) return null;
                return (
                    <Tooltip title={`${config.label}: ${count} (${percent.toFixed(1)}%)`} key={key}>
                        <div style={{ 
                            width: `${percent}%`, 
                            background: config.color === "blue" ? token.colorPrimary : (config.color === "magenta" ? "#eb2f96" : (config.color === "purple" ? "#722ed1" : "#faad14")),
                            height: "100%",
                            transition: "width 0.5s ease"
                        }} />
                    </Tooltip>
                );
            })}
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {Object.entries(TIER_CONFIG).map(([key, config]) => (
                <Space size={4} key={key}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: config.color === "blue" ? token.colorPrimary : (config.color === "magenta" ? "#eb2f96" : (config.color === "purple" ? "#722ed1" : "#faad14")) }} />
                    <span style={{ fontSize: 12 }}>{config.label} ({stats?.tier_distribution[key] || 0})</span>
                </Space>
            ))}
        </div>
      </Card>

      {/* Main Table Card */}
      <Card 
        style={{ borderRadius: 16, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }} 
        bodyStyle={{ padding: 24 }}
      >
        {/* Advanced Filters */}
        <div style={{ 
            marginBottom: 24, 
            padding: 24, 
            background: isDarkMode ? "rgba(255,255,255,0.02)" : "#fff", 
            borderRadius: 16,
            border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.05)" : "#f0f0f0"}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
            <Row gutter={[20, 20]}>
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Text strong style={{ display: "block", marginBottom: 8, fontSize: 12, color: token.colorTextDescription }}>PILIH TIER</Text>
                    <Select 
                        style={{ width: "100%" }} 
                        placeholder="Semua Tier" 
                        allowClear
                        value={searchParams.get("tier") || undefined}
                        onChange={(v) => {
                            setSearchParams(p => { v ? p.set("tier", v) : p.delete("tier"); p.set("page", "1"); return p; });
                        }}
                    >
                        {Object.entries(TIER_CONFIG).map(([key, c]) => (
                            <Select.Option key={key} value={key}>{c.label}</Select.Option>
                        ))}
                    </Select>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Text strong style={{ display: "block", marginBottom: 8, fontSize: 12, color: token.colorTextDescription }}>STATUS AKUN</Text>
                    <Select 
                        style={{ width: "100%" }} 
                        placeholder="Semua Status"
                        allowClear
                        value={searchParams.get("status") || undefined}
                        onChange={(v) => {
                            setSearchParams(p => { v ? p.set("status", v) : p.delete("status"); p.set("page", "1"); return p; });
                        }}
                    >
                        <Select.Option value="active">Aktif</Select.Option>
                        <Select.Option value="inactive">Belum Aktif</Select.Option>
                    </Select>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Text strong style={{ display: "block", marginBottom: 8, fontSize: 12, color: token.colorTextDescription }}>SECTION (M4)</Text>
                    <Select 
                        style={{ width: "100%" }} 
                        placeholder="Pilih Section"
                        allowClear
                        value={searchParams.get("section") || undefined}
                        onChange={(v) => {
                            setSearchParams(p => { v ? p.set("section", v) : p.delete("section"); p.set("page", "1"); return p; });
                        }}
                    >
                        <Select.Option value="Abby's">Abby's</Select.Option>
                        <Select.Option value="Bev's">Bev's</Select.Option>
                    </Select>
                </Col>
                <Col xs={24} sm={12} md={6} lg={12}>
                    <Text strong style={{ display: "block", marginBottom: 8, fontSize: 12, color: token.colorTextDescription }}>CARI MEMBER</Text>
                    <Input.Search 
                        placeholder="Nama, email, atau telepon..." 
                        onSearch={(v) => setSearchParams(p => { v ? p.set("q", v) : p.delete("q"); p.set("page", "1"); return p; })}
                        allowClear
                        enterButton
                    />
                </Col>

                {/* Second Row Filters */}
                <Col xs={24} md={12} lg={8}>
                    <Text strong style={{ display: "block", marginBottom: 8, fontSize: 12, color: token.colorTextDescription }}>JOIN DATE RANGE</Text>
                    <RangePicker 
                        style={{ width: "100%" }}
                        onChange={(dates) => {
                            setSearchParams(p => {
                                if (dates) {
                                    p.set("date_from", dates[0]!.format("YYYY-MM-DD"));
                                    p.set("date_to", dates[1]!.format("YYYY-MM-DD"));
                                } else {
                                    p.delete("date_from");
                                    p.delete("date_to");
                                }
                                p.set("page", "1");
                                return p;
                            });
                        }}
                    />
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Text strong style={{ display: "block", marginBottom: 8, fontSize: 12, color: token.colorTextDescription }}>LTV RANGE (POIN M2)</Text>
                    <Space.Compact style={{ width: "100%" }}>
                        <Input 
                            placeholder="Min" 
                            style={{ width: "50%" }}
                            value={searchParams.get("points_min") || ""}
                            onChange={(e) => setSearchParams(p => { e.target.value ? p.set("points_min", e.target.value) : p.delete("points_min"); return p; })}
                        />
                        <Input 
                            placeholder="Max" 
                            style={{ width: "50%" }}
                            value={searchParams.get("points_max") || ""}
                            onChange={(e) => setSearchParams(p => { e.target.value ? p.set("points_max", e.target.value) : p.delete("points_max"); return p; })}
                        />
                    </Space.Compact>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Text strong style={{ display: "block", marginBottom: 8, fontSize: 12, color: token.colorTextDescription }}>PROFILE COMPL. %</Text>
                    <Space.Compact style={{ width: "100%" }}>
                        <Input 
                            placeholder="Min %" 
                            style={{ width: "50%" }}
                            value={searchParams.get("profile_min") || ""}
                            onChange={(e) => setSearchParams(p => { e.target.value ? p.set("profile_min", e.target.value) : p.delete("profile_min"); return p; })}
                        />
                        <Input 
                            placeholder="Max %" 
                            style={{ width: "50%" }}
                            value={searchParams.get("profile_max") || ""}
                            onChange={(e) => setSearchParams(p => { e.target.value ? p.set("profile_max", e.target.value) : p.delete("profile_max"); return p; })}
                        />
                    </Space.Compact>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Text strong style={{ display: "block", marginBottom: 8, fontSize: 12, color: token.colorTextDescription }}>TRX COUNT</Text>
                    <Space.Compact style={{ width: "100%" }}>
                        <Input 
                            placeholder="Min" 
                            style={{ width: "50%" }}
                            value={searchParams.get("transactions_min") || ""}
                            onChange={(e) => setSearchParams(p => { e.target.value ? p.set("transactions_min", e.target.value) : p.delete("transactions_min"); return p; })}
                        />
                        <Input 
                            placeholder="Max" 
                            style={{ width: "50%" }}
                            value={searchParams.get("transactions_max") || ""}
                            onChange={(e) => setSearchParams(p => { e.target.value ? p.set("transactions_max", e.target.value) : p.delete("transactions_max"); return p; })}
                        />
                    </Space.Compact>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4} style={{ display: "flex", alignItems: "flex-end" }}>
                    <Button 
                        type="primary"
                        icon={<ReloadOutlined />} 
                        onClick={() => {
                            setSearchParams(new URLSearchParams());
                            fetchData();
                        }}
                        style={{ width: "100%", borderRadius: 8 }}
                    >
                        RESET SEMUA
                    </Button>
                </Col>
            </Row>

            {/* Active Filter Tags */}
            <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Array.from(searchParams.entries()).map(([key, value]) => {
                    if (key === "page" || key === "per_page" || !value) return null;
                    return (
                        <Tag 
                            key={key} 
                            closable 
                            onClose={() => setSearchParams(p => { p.delete(key); return p; })}
                            style={{ borderRadius: 12, padding: "2px 10px", backgroundColor: token.colorPrimary + "10", border: `1px solid ${token.colorPrimary}40`, color: token.colorPrimary }}
                        >
                            <span style={{ fontWeight: 600, textTransform: "uppercase", fontSize: 10, marginRight: 4 }}>{key.replace("_", " ")}:</span>
                            {value}
                        </Tag>
                    );
                })}
            </div>
        </div>

        <Table<CrmMember>
          columns={columns}
          rowKey="id"
          dataSource={data}
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            position: ["bottomRight"],
          }}
          onChange={(p) => {
            setSearchParams(prev => {
                prev.set("page", String(p.current));
                prev.set("per_page", String(p.pageSize));
                return prev;
            });
          }}
        />
      </Card>

      {/* Change Tier Modal */}
      <Modal
        title={`Ubah Tier Member: ${selectedMember?.name}`}
        visible={isTierModalVisible}
        onCancel={() => setIsTierModalVisible(false)}
        onOk={() => form.submit()}
        okText="Update Tier"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical" onFinish={handleTierUpdate}>
          <Form.Item name="tier" label="Pilih Tier Baru" rules={[{ required: true }]}>
            <Select>
                {Object.entries(TIER_CONFIG).map(([key, c]) => (
                    <Select.Option key={key} value={key}>{c.label}</Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Perubahan tier akan mempengaruhi akses fitur dan perhitungan komisi di aplikasi user.
          </Text>
        </Form>
      </Modal>

      {/* Give Voucher Modal */}
      <Modal
        title={`Beri Voucher ke: ${selectedMember?.name}`}
        visible={isVoucherModalVisible}
        onCancel={() => setIsVoucherModalVisible(false)}
        onOk={() => voucherForm.submit()}
        okText="Kirim Voucher"
        cancelText="Batal"
      >
        <Form form={voucherForm} layout="vertical" onFinish={handleVoucherGive}>
          <Form.Item name="voucher_id" label="Pilih Voucher" rules={[{ required: true, message: "Pilih voucher terlebih dahulu" }]}>
            <Select 
                showSearch 
                placeholder="Cari voucher berdasarkan nama atau kode"
                filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                options={vouchers.map(v => ({ label: `${v.name} (${v.code})`, value: v.id }))}
            />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Member akan menerima notifikasi bahwa mereka mendapatkan voucher baru.
          </Text>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title="Detail Member CRM"
        placement="right"
        width={500}
        onClose={() => setIsDetailVisible(false)}
        visible={isDetailVisible}
      >
        {selectedMember && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Avatar size={64} src={selectedMember.photo_profile_url} icon={<UserOutlined />} />
              <div>
                <Title level={4} style={{ margin: 0 }}>{selectedMember.name}</Title>
                <Text type="secondary">{selectedMember.email}</Text>
              </div>
            </div>
            
            <Descriptions title="Informasi Akun" bordered column={1} size="small">
              <Descriptions.Item label="ID Member">{selectedMember.id}</Descriptions.Item>
              <Descriptions.Item label="Tier">{selectedMember.crm_tier}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedMember.is_active === 1 ? "success" : "default"}>
                  {selectedMember.is_active === 1 ? "Aktif" : "Belum Aktif"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Join Date">
                {new Date(selectedMember.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </Descriptions.Item>
              <Descriptions.Item label="Ref Code">{selectedMember.referral_code || "-"}</Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "12px 0" }} />

            <Descriptions title="Statistik & Gamifikasi" bordered column={1} size="small">
              <Descriptions.Item label="Total Pesanan">{selectedMember.total_orders}</Descriptions.Item>
              <Descriptions.Item label="Total Belanja (LTV)">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(selectedMember.ltv)}
              </Descriptions.Item>
              <Descriptions.Item label="Poin M2">{selectedMember.points_m2?.toLocaleString("id-ID")}</Descriptions.Item>
              <Descriptions.Item label="Kelengkapan Profil">{selectedMember.profile_m1}%</Descriptions.Item>
              <Descriptions.Item label="Badge">{selectedMember.badge_active}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 20 }}>
              <Button 
                block 
                type="primary" 
                icon={<WhatsAppOutlined />} 
                style={{ backgroundColor: "#25D366" }}
                onClick={() => {
                  const num = formatWhatsAppNumber(selectedMember.phoneNumber);
                  if (num) {
                    window.open(`https://wa.me/${num}`, "_blank");
                  } else {
                    message.warning("Nomor telepon tidak tersedia");
                  }
                }}
              >
                Hubungi via WhatsApp
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CRMMemberTab;
