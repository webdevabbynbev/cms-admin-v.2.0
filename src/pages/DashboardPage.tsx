import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  message,
  Typography,
  Space,
  theme
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  UserOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  StockOutlined
} from "@ant-design/icons";
import MainLayout from "../layout/MainLayout";
import http from "../api/http";

import { useNavigate } from "react-router-dom";
import TransactionChart from "../components/Charts/TransactionChart";
import RegisterUserPeriodChart from "../components/Charts/RegisterUserPeriodChart";
import TrafficChart from "../components/Charts/TrafficChart";
import TableUserCart from "../components/Tables/Dashboard/TableUserCart";
import BulkFolderMediaUpload from "../components/Uploads/BulkFolderMediaUpload";
import LinkFromS3MediaUpload from "../components/Uploads/LinkFromS3MediaUpload";

const { Title, Text } = Typography;

interface ProductTable {
  key: string | number;
  name: string;
  quantity: number;
}

interface KpiData {
  users: { total: number; new_this_month: number };
  transactions: { total: number; net_sales_this_month: number };
  products: { total: number; active: number };
  top_customers: { id: number; name: string; total_spent: number; total_orders: number }[];
}


const fmtIDR = (n: any) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    Number(n || 0),
  );

const DashboardPage: React.FC = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [topProducts, setTopProducts] = useState<ProductTable[]>([]);
  const [leastProducts, setLeastProducts] = useState<ProductTable[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchKpis();
    fetchTopProducts();
    fetchLeastProducts();
  }, []);

  const fetchKpis = async () => {
    try {
      const response = await http.get("/admin/stats-dashboard");

      if (response?.data?.serve) {
        setKpi(response.data.serve);
      }
    } catch (error) {
      
      message.error("Gagal memuat data statistik utama");
    }
  };

  const fetchTopProducts = async () => {
    setLoading(true);
    try {
      const response = await http.get("/admin/top-product-sell");
      if (response?.data?.serve?.length) {
        setTopProducts(response.data.serve.map((p: any) => ({
          key: p.id,
          name: p.name,
          quantity: p.total,
        })));
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const fetchLeastProducts = async () => {
    try {
      const response = await http.get("/admin/less-product-sell");
      if (response?.data?.serve?.length) {
        setLeastProducts(response.data.serve.map((p: any) => ({
          key: p.id,
          name: p.name,
          quantity: p.total,
        })));
      }
    } catch (error) {
      
    }
  };

  const productColumns: ColumnsType<ProductTable> = [
    {
      title: "Nama Produk",
      dataIndex: "name",
      key: "name",
      width: "76%",
      ellipsis: true,
      render: (text, record) => (
        <Button
          type="link"
          title={text}
          style={{
            padding: 0,
            display: "block",
            width: "100%",
            overflow: "hidden",
            textAlign: "left",
          }}
          onClick={() => navigate(`/product-form?id=${record.key}`)}
        >
          <span
            style={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </span>
        </Button>
      ),
    },
    {
      title: "Terjual",
      dataIndex: "quantity",
      key: "quantity",
      align: "right",
      width: "24%",
    },
  ];

  const customerColumns: ColumnsType<any> = [
    {
      title: "Pelanggan",
      dataIndex: "name",
      key: "name",
      width: "42%",
      ellipsis: true,
      render: (text) => (
        <strong
          style={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={text}
        >
          {text}
        </strong>
      ),
    },
    {
      title: "Pesanan",
      dataIndex: "total_orders",
      key: "total_orders",
      align: "center",
      width: "22%",
    },
    {
      title: "Total Belanja",
      dataIndex: "total_spent",
      key: "total_spent",
      align: "right",
      width: "36%",
      render: (v) => <span style={{ color: "#52c41a", fontWeight: 600 }}>{fmtIDR(v)}</span>,
    },
  ];



  const renderKpiCard = (title: string, value: any, icon: React.ReactNode, color: string, subValue?: any, subLabel?: string) => (
    <Card
      bordered={true}
      style={{
        borderRadius: 16,
        boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
        height: '100%',
        border: `1px solid ${token.colorBorderSecondary}`,
        overflow: 'hidden',
        backgroundColor: token.colorBgContainer
      }}
      bodyStyle={{ padding: '24px 20px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          backgroundColor: `${color}12`,
          borderRadius: 14,
          width: 56,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
          {React.cloneElement(icon as React.ReactElement, { style: { fontSize: 28, color: color } })}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text type="secondary" style={{
            fontSize: 13,
            fontWeight: 500,
            display: 'block',
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {title}
          </Text>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: token.colorText, lineHeight: 1.2 }}>{value}</span>
            {subValue !== undefined && (
              <span style={{
                fontSize: 11,
                color: '#52c41a',
                backgroundColor: '#f6ffed',
                padding: '2px 8px',
                borderRadius: 6,
                border: '1px solid #b7eb8f',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}>
                +{subValue} {subLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );


  return (
    <MainLayout title={"Ringkasan Dashboard"}>
      <div style={{ backgroundColor: token.colorBgLayout, minHeight: '100vh', margin: '-24px', padding: '32px 24px' }}>

        {/* ROW 1: KARTU KPI */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: token.colorText }}>
              <span style={{ marginRight: 8 }}>💼</span> Ringkasan Bisnis
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} xl={8}>
              {renderKpiCard("Total Pelanggan", kpi?.users.total || 0, <UserOutlined />, "#1890ff", kpi?.users.new_this_month, "baru")}
            </Col>
            <Col xs={24} sm={12} xl={8}>
              {renderKpiCard("Total Pesanan (Berhasil)", kpi?.transactions.total || 0, <ShoppingCartOutlined />, "#722ed1")}
            </Col>
            <Col xs={24} sm={12} xl={8}>
              {renderKpiCard("Omzet (Bulan Ini)", fmtIDR(kpi?.transactions.net_sales_this_month), <RiseOutlined />, "#52c41a")}
            </Col>
            <Col xs={24} sm={12} xl={8}>
              {renderKpiCard("Katalog Produk", kpi?.products.total || 0, <ShoppingOutlined />, "#fa8c16")}
            </Col>
            <Col xs={24} sm={12} xl={8}>
              {renderKpiCard("Produk Aktif", kpi?.products.active || 0, <CheckCircleOutlined />, "#2f54eb")}
            </Col>
            <Col xs={24} sm={12} xl={8}>
              {renderKpiCard("Tingkat Konversi", "2.45%", <StockOutlined />, "#eb2f96")}
            </Col>
          </Row>
        </div>

        <Row gutter={[24, 24]}>
          {/* KOLOM UTAMA: GRAFIK */}
          <Col xs={24} lg={16} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card
              title={<span style={{ fontWeight: 700, color: token.colorText }}><RiseOutlined style={{ marginRight: 8, color: '#52c41a' }} /> Performa Penjualan</span>}
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
              bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <TransactionChart />
            </Card>

            <Row gutter={[24, 24]} style={{ display: 'flex' }}>
              <Col xs={24} md={12} style={{ display: 'flex' }}>
                <Card
                  title={<span style={{ fontWeight: 700, color: token.colorText }}><UserOutlined style={{ marginRight: 8, color: '#1890ff' }} /> Pertumbuhan Pengguna</span>}
                  bordered={false}
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  bodyStyle={{ flex: 1 }}
                >
                  <RegisterUserPeriodChart />
                </Card>
              </Col>
              <Col xs={24} md={12} style={{ display: 'flex' }}>
                <Card
                  title={<span style={{ fontWeight: 700, color: token.colorText }}><StockOutlined style={{ marginRight: 8, color: '#faad14' }} /> Log Aktivitas</span>}
                  bordered={false}
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  bodyStyle={{ flex: 1 }}
                >
                  <TrafficChart />
                </Card>
              </Col>
            </Row>
          </Col>

          {/* KOLOM SAMPING: TABEL */}
          <Col xs={24} lg={8} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card
              title={<span style={{ fontWeight: 700, color: token.colorText }}>🏆 Produk Terlaris</span>}
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                overflow: 'hidden'
              }}
              bodyStyle={{ flex: 1, minWidth: 0 }}
              extra={<Button type="link" size="small" onClick={() => navigate('/reports/sales')}>Detail</Button>}
            >
              <Table<ProductTable>
                loading={loading}
                dataSource={topProducts}
                columns={productColumns}
                pagination={false}
                size="small"
                tableLayout="fixed"
                style={{ width: "100%" }}
              />
            </Card>

            <Card
              title={<span style={{ fontWeight: 700, color: token.colorText }}>⭐ Pelanggan Setia</span>}
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                overflow: 'hidden'
              }}
              bodyStyle={{ flex: 1, minWidth: 0 }}
            >
              <Table
                dataSource={kpi?.top_customers || []}
                columns={customerColumns}
                pagination={false}
                size="small"
                tableLayout="fixed"
                style={{ width: "100%" }}
              />
            </Card>

            <Card
              title={<span style={{ fontWeight: 700, color: token.colorText }}>📉 Stok Rendah / Penjualan Rendah</span>}
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                overflow: 'hidden'
              }}
              bodyStyle={{ flex: 1, minWidth: 0 }}
            >
              <Table<ProductTable>
                dataSource={leastProducts}
                columns={productColumns}
                pagination={false}
                size="small"
                tableLayout="fixed"
                style={{ width: "100%" }}
              />
            </Card>
          </Col>

          {/* BAGIAN TOOL SISTEM */}
          <Col xs={24}>
            <div style={{ marginTop: 24 }}>
              <Title level={4} style={{ marginBottom: 24, fontWeight: 700, color: token.colorText }}>
                <span style={{ marginRight: 8 }}>⚙️</span> Manajemen & Utilitas Sistem
              </Title>
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                  <TableUserCart minimal />
                </Col>
                <Col xs={24} lg={8}>
                  <Space direction="vertical" style={{ width: "100%" }} size={16}>
                    <BulkFolderMediaUpload />
                    <LinkFromS3MediaUpload />
                  </Space>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );


};

export default DashboardPage;

