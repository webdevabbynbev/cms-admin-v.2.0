import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Card,
  message,
  Tooltip,
  Space,
  Avatar,
  Typography,
  Button,
  Row,
  Col,
  theme,
  Alert,
  Grid,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  UserOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  ArrowDownOutlined,
  GiftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import http from "../../../api/http";
import dayjs from "dayjs";
import { useThemeStore } from "../../../hooks/useThemeStore";

const { Text, Title, Paragraph } = Typography;

interface UpgradeEligible {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  points: number;
  ltv: number;
  phoneNumber?: string | null;
}

interface UpgradeStats {
  eligible_count: number;
  almost_eligible: number;
  pending_abmua: number;
  apply_abcd: number;
}

const CRMUpgradePathTab: React.FC = () => {
  theme.useToken();
  const { isDarkMode } = useThemeStore();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    eligible_for_abeauties: UpgradeEligible[];
    stats: UpgradeStats;
  } | null>(null);

  const fetchUpgradeData = async () => {
    setLoading(true);
    try {
      const resp = await http.get("/admin/crm/upgrade-path");
      if (resp.data?.serve) {
        setData(resp.data.serve);
      }
    } catch (err) {
      message.error("Gagal mengambil data upgrade path");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpgradeData();
  }, []);

  const columns: ColumnsType<UpgradeEligible> = [
    {
      title: "Member",
      key: "name",
      render: (_, rec) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Text strong style={{ fontSize: 13 }}>{rec.name}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{rec.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v) => <Text style={{ fontSize: 12 }}>{dayjs(v).format("DD MMM YYYY")}</Text>,
    },
    {
      title: "Telepon",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: 130,
      render: (v) => <Text style={{ fontSize: 12 }}>{v || "-"}</Text>,
    },
    {
      title: "Poin (LTV)",
      key: "points",
      render: (_, rec) => (
        <div style={{ width: 150 }}>
          <Text strong style={{ color: "#b31f5f" }}>{rec.points?.toLocaleString()} Poin</Text>
          <div style={{ fontSize: 11, color: "#888" }}>
            LTV: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(rec.ltv)}
          </div>
        </div>
      ),
    },
    {
        title: "Status",
        key: "status",
        render: (_, rec) => {
            const isEligible = rec.ltv >= 500000;
            return (
                <Tag 
                    style={{ 
                        fontWeight: 600, 
                        color: isEligible ? "#52c41a" : "#faad14", 
                        backgroundColor: isEligible ? "#f6ffed" : "#fffbe6", 
                        border: `1px solid ${isEligible ? "#b7eb8f" : "#ffe58f"}`,
                        borderRadius: 12
                    }}
                >
                    {isEligible ? "Eligible for ABeauties" : "Almost There"}
                </Tag>
            );
        }
    },
    {
      title: "Aksi",
      key: "action",
      align: "right",
      render: (_, rec) => {
          const formatWhatsAppNumber = (phone: string | null | undefined) => {
            if (!phone) return "";
            let cleaned = phone.replace(/\D/g, "");
            if (cleaned.startsWith("0")) cleaned = "62" + cleaned.substring(1);
            else if (cleaned.startsWith("8")) cleaned = "62" + cleaned;
            return cleaned;
          };

          return (
            <Space>
              <Tooltip title="Hubungi WA">
                <Button 
                    size="small" 
                    icon={<GlobalOutlined style={{ color: "#25D366" }} />} 
                    onClick={() => {
                        const num = formatWhatsAppNumber(rec.phoneNumber);
                        if (num) window.open(`https://wa.me/${num}`, "_blank");
                        else message.warning("Nomor tidak tersedia");
                    }}
                />
              </Tooltip>
              <Tooltip title="Beri Voucher">
                <Button size="small" icon={<GiftOutlined style={{ color: "#faad14" }} />} />
              </Tooltip>
              <Button type="primary" size="small" disabled={rec.ltv < 500000} style={{ borderRadius: 8 }}>
                Upgrade
              </Button>
            </Space>
          );
      }
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>
        {`
          .upgrade-roadmap-card .ant-card-head-title {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: unset !important;
            line-height: 1.35;
          }
          .upgrade-table-card .ant-card-head-title {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: unset !important;
            line-height: 1.35;
            padding-top: 6px !important;
          }
          .upgrade-table-card .ant-card-head {
            padding-top: 6px !important;
          }
        `}
      </style>
      {/* Banner / Guide */}
      <Alert
        message={<Title level={5} style={{ margin: 0, color: "#b31f5f" }}>Meningkatkan Engagement dengan Jalur Upgrade</Title>}
        description={
            <Paragraph style={{ margin: 0, fontSize: 13 }}>
                Gunakan tab ini untuk memantau member yang potensial naik tier. Upgrade ke <b>ABeauties</b> dilakukan otomatis jika poin (LTV) mencapai threshold. Untuk <b>ABMUA</b> dan <b>ABCD/KOL</b>, member harus melakukan pendaftaran (Apply) terlebih dahulu.
            </Paragraph>
        }
        type="info"
        icon={<RocketOutlined />}
        showIcon
        style={{ borderRadius: 16, border: "none", background: isDarkMode ? "rgba(179,31,95,0.15)" : "rgba(179,31,95,0.05)" }}
      />

      {/* Upgrade Stats */}
      <Row gutter={[16, 16]}>
        {[
          { label: "Eligible ABeauties", value: data?.stats?.eligible_count || 0, icon: <CheckCircleOutlined />, color: "#52c41a" },
          { label: "Hampir Eligible", value: data?.stats?.almost_eligible || 0, icon: <ClockCircleOutlined />, color: "#faad14" },
          { label: "Pending ABMUA (Apply)", value: data?.stats?.pending_abmua || 0, icon: <ReloadOutlined />, color: "#722ed1" },
          { label: "Apply ABCD/KOL", value: data?.stats?.apply_abcd || 0, icon: <UserOutlined />, color: "#1890ff" },
        ].map((s, i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <Card bodyStyle={{ padding: 20 }} style={{ borderRadius: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>{s.label}</Text>
                  <Title level={3} style={{ margin: 0 }}>{s.value}</Title>
                </div>
                <div style={{ fontSize: 24, color: s.color }}>{s.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Path Visualization */}
      <Card
        className="upgrade-roadmap-card"
        title="Visualisasi Jalur Upgrade (Roadmap)"
        style={{ borderRadius: 16 }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            padding: isMobile ? "8px 8px" : "10px 40px",
            gap: isMobile ? 12 : 20,
            textAlign: "center",
          }}
        >
          {[
            { title: "Customer", subtitle: "Entry Level", color: "#1890ff", icon: <UserOutlined /> },
            { title: "ABeauties", subtitle: "Poin / LTV Based", color: "#eb2f96", icon: <RocketOutlined /> },
            { title: "ABMUA", subtitle: "Application Process", color: "#722ed1", icon: <CheckCircleOutlined /> },
            { title: "ABCD / KOL", subtitle: "Ambassador Level", color: "#faad14", icon: <GlobalOutlined /> },
          ].map((step, idx, arr) => (
            <React.Fragment key={step.title}>
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 180 }}>
                <Avatar size={48} style={{ backgroundColor: step.color, marginBottom: 8 }} icon={step.icon} />
                <div style={{ fontWeight: 600, whiteSpace: "normal", wordBreak: "break-word" }}>{step.title}</div>
                <div style={{ fontSize: 11, color: "#888", whiteSpace: "normal", wordBreak: "break-word" }}>{step.subtitle}</div>
              </div>
              {idx < arr.length - 1 ? (
                isMobile ? (
                  <ArrowDownOutlined style={{ fontSize: 20, color: "#ccc" }} />
                ) : (
                  <ArrowRightOutlined style={{ fontSize: 24, color: "#ccc" }} />
                )
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Tables Section */}
      <Row gutter={[24, 24]}>
        <Col span={24}>
            <Card 
                className="upgrade-table-card"
                title={
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <span>Potensi ABeauties</span>
                    <Tag color="blue" style={{ margin: 0 }}>M1 Completion High</Tag>
                  </div>
                } 
                style={{ borderRadius: 16 }}
                extra={<Button icon={<ReloadOutlined />} onClick={fetchUpgradeData} />}
            >
                <div className="overflow-x-auto md:overflow-visible">
                  <Table 
                      columns={columns} 
                      dataSource={data?.eligible_for_abeauties || []} 
                      loading={loading}
                      rowKey="id"
                      scroll={{ x: "max-content" }}
                      pagination={{ pageSize: 5 }}
                  />
                </div>
            </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CRMUpgradePathTab;
