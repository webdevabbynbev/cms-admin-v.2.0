import React from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  InputNumber,
  Row,
  Space,
  Spin,
  Typography,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { theme } from "antd";
import { useThemeStore } from "../../../hooks/useThemeStore";

const { Text } = Typography;

type Props = {
  inputMode: "product" | "brand" | "all" | "variant";
  allPercent?: number | null;
  setAllPercent?: (v: number | null) => void;
  allMaxDiscount?: number | null;
  setAllMaxDiscount?: (v: number | null) => void;
  bulkPercent?: number | null;
  setBulkPercent?: (v: number | null) => void;
  bulkPromoStock?: number | null;
  setBulkPromoStock?: (v: number | null) => void;
  bulkMaxDiscount?: number | null;
  setBulkMaxDiscount?: (v: number | null) => void;
  selectedVariantIds?: number[];
  variants?: { productVariantId: number; basePrice?: number | null }[];
  applyBulk?: (scope: "selected" | "all") => void;
  deleteSelectedVariants?: () => void;
  rupiahFormatter: (value: string | number | undefined) => string;
  rupiahParser: (value?: string) => number;
  loading?: boolean;
};

const DiscountBulkCard: React.FC<Props> = ({
  inputMode,
  allPercent,
  setAllPercent,
  allMaxDiscount,
  setAllMaxDiscount,
  bulkPercent,
  setBulkPercent,
  bulkPromoStock,
  setBulkPromoStock,
  bulkMaxDiscount,
  setBulkMaxDiscount,
  selectedVariantIds = [],
  variants = [],
  applyBulk,
  deleteSelectedVariants,
  rupiahFormatter,
  rupiahParser,
  loading,
}) => {
  const { token } = theme.useToken();
  const { isDarkMode } = useThemeStore();
  const isLoading = Boolean(loading);
  const isAllMode = inputMode === "all";

  return (
    <>
      <Card
        size="small"
        variant="outlined"
        style={{
          marginBottom: 12,
          borderRadius: 8,
          background: isDarkMode ? token.colorBgContainer : "#FFF7FB",
          borderColor: isDarkMode ? token.colorBorderSecondary : "#f0d7e5",
        }}
        styles={{ body: { padding: 16 } }}
        title={
          <span style={{ fontWeight: 600, fontSize: 14, color: isDarkMode ? token.colorPrimary : "#9B3C6C" }}>
            Perubahan Massal
          </span>
        }
        extra={
          isAllMode ? (
            isLoading ? (
              <Space size={6}>
                <Spin size="small" />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Memuat semua produk...
                </Text>
              </Space>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>
                Berlaku untuk semua produk (kecuali sale/flash sale)
              </Text>
            )
          ) : (
            <Text type="secondary" style={{ fontSize: 13 }}>
              Terpilih:{" "}
              <b style={{ color: isDarkMode ? token.colorPrimary : "#9B3C6C" }}>{selectedVariantIds.length}</b>{" "}
              varian
            </Text>
          )
        }
      >
        {isAllMode ? (
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 8,
                  color: token.colorText,
                }}
              >
                Diskon (%)
              </div>
              <InputNumber
                style={{ width: "100%", borderRadius: 8 }}
                size="large"
                min={0}
                max={100}
                value={allPercent ?? undefined}
                disabled={isLoading}
                onChange={(v) =>
                  setAllPercent?.(
                    v === null || v === undefined ? null : Number(v),
                  )
                }
                placeholder="Contoh: 10"
                addonAfter="%"
              />
            </Col>
            <Col xs={24} md={12}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 8,
                  color: token.colorText,
                }}
              >
                Maksimal Diskon
              </div>
              <InputNumber
                style={{ width: "100%", borderRadius: 8 }}
                size="large"
                min={0}
                formatter={rupiahFormatter}
                parser={rupiahParser}
                value={allMaxDiscount ?? undefined}
                disabled={isLoading}
                onChange={(v) =>
                  setAllMaxDiscount?.(
                    v === null || v === undefined ? null : Number(v),
                  )
                }
                placeholder="Rp 0"
              />
            </Col>
          </Row>
        ) : (
          <>
            <Row gutter={12}>
              <Col xs={24} md={6}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 8,
                    color: token.colorText,
                  }}
                >
                  Diskon (%)
                </div>
                <InputNumber
                  style={{ width: "100%", borderRadius: 8 }}
                  size="large"
                  min={0}
                  max={100}
                  value={bulkPercent ?? undefined}
                  onChange={(v) =>
                    setBulkPercent?.(
                      v === null || v === undefined ? null : Number(v),
                    )
                  }
                  placeholder="Contoh: 10"
                  addonAfter="%"
                />
              </Col>
              <Col xs={24} md={6}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 8,
                    color: token.colorText,
                  }}
                >
                  Batas Harga Diskon
                </div>
                <InputNumber
                  style={{ width: "100%", borderRadius: 8 }}
                  size="large"
                  min={0}
                  formatter={rupiahFormatter}
                  parser={rupiahParser}
                  value={bulkMaxDiscount ?? undefined}
                  onChange={(v) =>
                    setBulkMaxDiscount?.(
                      v === null || v === undefined ? null : Number(v),
                    )
                  }
                  placeholder="Rp 0"
                />
              </Col>
              <Col xs={24} md={6}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 8,
                    color: token.colorText,
                  }}
                >
                  Stok Promo
                </div>
                <InputNumber
                  style={{ width: "100%", borderRadius: 8 }}
                  size="large"
                  min={0}
                  value={bulkPromoStock ?? undefined}
                  onChange={(v) =>
                    setBulkPromoStock?.(
                      v === null || v === undefined ? null : Number(v),
                    )
                  }
                  placeholder="Tidak terbatas"
                />
              </Col>
            </Row>

            <Divider style={{ margin: "16px 0" }} />

            <Space wrap size="middle">
              <Button
                disabled={!variants.length}
                onClick={() => applyBulk?.("all")}
                size="large"
                style={{ borderRadius: 8 }}
              >
                Terapkan ke Semua
              </Button>
              <Button
                type="primary"
                disabled={!selectedVariantIds.length}
                onClick={() => applyBulk?.("selected")}
                size="large"
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  background: isDarkMode
                    ? `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
                    : "linear-gradient(135deg, #B24A7C 0%, #8F2F5F 100%)",
                  boxShadow: isDarkMode ? "none" : "0 6px 16px rgba(155, 60, 108, 0.28)",
                }}
              >
                Terapkan ke Terpilih ({selectedVariantIds.length})
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={!selectedVariantIds.length}
                onClick={() => deleteSelectedVariants?.()}
                size="large"
                style={{ borderRadius: 8 }}
              >
                Hapus Terpilih
              </Button>
            </Space>
          </>
        )}

        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isAllMode
              ? "Diskon akan diterapkan ke semua produk saat klik Simpan."
              : "Gunakan perubahan massal untuk mempercepat pengaturan diskon."}
          </Text>
        </div>
      </Card>
    </>
  );
};

export default DiscountBulkCard;
