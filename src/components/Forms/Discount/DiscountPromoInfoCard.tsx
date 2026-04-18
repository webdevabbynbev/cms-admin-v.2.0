import React from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  Upload,
  theme,
} from "antd";
import { useThemeStore } from "../../../hooks/useThemeStore";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  TagOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";

const { Text } = Typography;

type Props = {
  mode: "create" | "edit";
  currentIdentifier: string | null;
  ioScope: "variant" | "product" | "brand";
  setIoScope: (scope: "variant" | "product" | "brand") => void;
  importTransfer: boolean;
  setImportTransfer: (v: boolean) => void;
  uploadProps: UploadProps;
  uploadRef: any;
  ioLoading: boolean;
  exportItems: (format: "csv" | "excel") => void;
  downloadTemplate: (format: "csv" | "excel") => void;
};

const DiscountPromoInfoCard: React.FC<Props> = ({
  mode,
  currentIdentifier,
  ioScope,
  setIoScope,
  importTransfer,
  setImportTransfer,
  uploadProps,
  uploadRef,
  ioLoading,
  exportItems,
  downloadTemplate,
}) => {
  const { token } = theme.useToken();
  const { isDarkMode } = useThemeStore();

  return (
    <Card
      variant="outlined"
      style={{
        marginBottom: 20,
        width: "100%",
        borderRadius: 12,
        boxShadow: isDarkMode ? "none" : token.boxShadowTertiary,
        border: `1px solid ${isDarkMode ? token.colorBorderSecondary : "#f0d7e5"}`,
        background: isDarkMode ? token.colorFillAlter : "#FEF0F3",
      }}
      styles={{ body: { padding: 24 } }}
      title={
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
            fontSize: 16,
            color: isDarkMode ? token.colorPrimary : "#9B3C6C",
          }}
        >
          <TagOutlined style={{ color: isDarkMode ? token.colorPrimary : "#9B3C6C" }} /> Informasi Promo
        </span>
      }
    >
      <Form.Item
        label="Nama Promo"
        name="name"
        rules={[{ required: true, message: "Nama promo wajib diisi" }]}
        style={{ marginBottom: 20 }}
      >
        <Input
          placeholder="Contoh: Promo Toko"
          size="large"
          style={{ borderRadius: 8 }}
        />
      </Form.Item>

      <Card
        size="small"
        variant="outlined"
        style={{
          marginBottom: 16,
          borderRadius: 8,
          background: isDarkMode ? token.colorBgContainer : "#FFF7FB",
          border: `1px solid ${isDarkMode ? token.colorBorderSecondary : "#f0d7e5"}`,
        }}
        styles={{ body: { padding: 16 } }}
        title={
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              color: isDarkMode ? token.colorPrimary : "#9B3C6C",
            }}
          >
            <CheckCircleOutlined style={{ color: isDarkMode ? token.colorPrimary : "#9B3C6C" }} /> Rentang Waktu
          </span>
        }
      >
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Tanggal Mulai"
              name="started_at"
              rules={[{ required: true, message: "Tanggal mulai wajib diisi" }]}
            >
              <Input type="date" size="large" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Tanggal Selesai"
              name="expired_at"
              rules={[
                { required: true, message: "Tanggal selesai wajib diisi" },
              ]}
            >
              <Input type="date" size="large" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        </Row>
        <Text style={{ fontSize: 12, color: token.colorTextDescription }}>
          Pastikan tanggal mulai ≤ tanggal selesai.
        </Text>
      </Card>

      {mode === "edit" && currentIdentifier ? (
        <Card
          size="small"
          variant="outlined"
          style={{
            marginBottom: 12,
            borderRadius: 8,
            background: isDarkMode ? token.colorBgContainer : "#FFF7FB",
            borderColor: isDarkMode ? token.colorBorderSecondary : "#f0d7e5",
          }}
          title="Export / Import Detail Varian"
          extra={
            <Tag color="geekblue">
              ID: <b>{currentIdentifier}</b>
            </Tag>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Space align="center">
                  <Text style={{ fontSize: 12, color: token.colorTextDescription }}>
                    Scope:
                  </Text>
                  <Select
                    size="small"
                    value={ioScope}
                    onChange={(v) => setIoScope(v)}
                    options={[
                      { value: "variant", label: "Per Variant" },
                      { value: "product", label: "Per Product" },
                      { value: "brand", label: "Per Brand" },
                    ]}
                    style={{ minWidth: 120 }}
                  />
                </Space>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Space>
                  <Text style={{ fontSize: 12, color: token.colorTextDescription }}>
                    Transfer dari promo aktif
                  </Text>
                  <Switch
                    size="small"
                    checked={importTransfer}
                    onChange={(v) => setImportTransfer(Boolean(v))}
                  />
                </Space>
              </Col>
              <Col xs={24} md={8} style={{ textAlign: "right" }}>
                <Upload {...uploadProps} ref={uploadRef}>
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    loading={ioLoading}
                    size="small"
                  >
                    Upload & Import
                  </Button>
                </Upload>
              </Col>
            </Row>

            <Divider style={{ margin: 0 }} />

            <Row gutter={[8, 8]}>
              <Col span={24}>
                <Space wrap size="small">
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    loading={ioLoading}
                    onClick={() => exportItems("csv")}
                  >
                    Export CSV
                  </Button>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    loading={ioLoading}
                    onClick={() => exportItems("excel")}
                  >
                    Export Excel
                  </Button>
                  <Divider type="vertical" />
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    loading={ioLoading}
                    onClick={() => downloadTemplate("csv")}
                  >
                    Template CSV
                  </Button>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    loading={ioLoading}
                    onClick={() => downloadTemplate("excel")}
                  >
                    Template Excel
                  </Button>
                </Space>
              </Col>
            </Row>

            <Alert
              type="info"
              showIcon
              message="Format import: CSV/XLSX"
              description={
                <div style={{ fontSize: 12 }}>
                  {ioScope === "variant" ? (
                    <>
                      Isi minimal <b>SKU</b> + <b>Harga Akhir</b>. Optional:
                      <b> Promo Stock</b> dan <b>is_active</b>.
                    </>
                  ) : (
                    <>
                      Isi minimal{" "}
                      <b>{ioScope === "brand" ? "brand_id" : "product_id"}</b> +{" "}
                      <b>value</b> dan <b>value_type</b> (percent/fixed).
                      Optional:
                      <b> promo_stock</b>, <b>purchase_limit</b>,{" "}
                      <b>max_discount</b>.
                    </>
                  )}
                </div>
              }
            />
          </Space>
        </Card>
      ) : null}
    </Card>
  );
};

export default DiscountPromoInfoCard;

