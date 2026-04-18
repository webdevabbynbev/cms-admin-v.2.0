import {
  Modal,
  Descriptions,
  Tag,
  Divider,
  Typography,
  Table,
  Space,
} from "antd";
import { GiftFilled } from "@ant-design/icons";
import {
  extractGiftsFromDetails,
  getProductVariantDisplay,
} from "../../utils/b1g1GiftUtils";
import { formatDate, money, getTransactionStatusMeta } from "./transactionUtils";
import type { Tx } from "./transactionUtils";

interface TransactionDetailModalProps {
  visible: boolean;
  onCancel: () => void;
  selectedTx: Tx | null;
}

export default function TransactionDetailModal({
  visible,
  onCancel,
  selectedTx,
}: TransactionDetailModalProps) {
  return (
    <Modal
      title="Detail Transaksi"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
      centered
      destroyOnClose
    >
      {selectedTx && (
        <div style={{ padding: "0 10px" }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item
              label="No. Transaksi"
              labelStyle={{ fontWeight: 600 }}
            >
              {selectedTx.transactionNumber}
            </Descriptions.Item>
            <Descriptions.Item
              label="Status"
              labelStyle={{ fontWeight: 600 }}
            >
              {(() => {
                const cfg = getTransactionStatusMeta(selectedTx);
                return <Tag color={cfg.color}>{cfg.text}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item
              label="Customer"
              labelStyle={{ fontWeight: 600 }}
            >
              {selectedTx.user?.fullName || selectedTx.user?.name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Email" labelStyle={{ fontWeight: 600 }}>
              {selectedTx.user?.email || "-"}
            </Descriptions.Item>
            <Descriptions.Item
              label="Telepon"
              labelStyle={{ fontWeight: 600 }}
            >
              {selectedTx.user?.phone || "-"}
            </Descriptions.Item>
            <Descriptions.Item
              label="Amount"
              labelStyle={{ fontWeight: 600 }}
            >
              Rp {money(selectedTx.amount)}
            </Descriptions.Item>
            <Descriptions.Item
              label="Tanggal"
              labelStyle={{ fontWeight: 600 }}
            >
              {formatDate(
                selectedTx.createdAt || (selectedTx as any).created_at,
              )}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left" style={{ margin: "24px 0 16px" }}>
            Pengiriman
          </Divider>

          {selectedTx.shipments && selectedTx.shipments.length > 0 ? (
            <Descriptions size="small" bordered column={2}>
              <Descriptions.Item
                label="Resi"
                labelStyle={{ fontWeight: 600 }}
              >
                {selectedTx.shipments[0].resiNumber ||
                  (selectedTx.shipments[0] as any).resi_number ||
                  "-"}
              </Descriptions.Item>
              <Descriptions.Item
                label="Service"
                labelStyle={{ fontWeight: 600 }}
              >
                {selectedTx.shipments[0].service || "-"}
              </Descriptions.Item>
              <Descriptions.Item
                label="Service Type"
                labelStyle={{ fontWeight: 600 }}
              >
                {selectedTx.shipments[0].serviceType || "-"}
              </Descriptions.Item>
              <Descriptions.Item
                label="Price"
                labelStyle={{ fontWeight: 600 }}
              >
                Rp {money(selectedTx.shipments[0].price)}
              </Descriptions.Item>
              <Descriptions.Item
                label="Penerima"
                labelStyle={{ fontWeight: 600 }}
              >
                {selectedTx.shipments[0].pic || "-"}
              </Descriptions.Item>
              <Descriptions.Item
                label="Telp Penerima"
                labelStyle={{ fontWeight: 600 }}
              >
                {selectedTx.shipments[0].picPhone ||
                  (selectedTx.shipments[0] as any).pic_phone ||
                  "-"}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Typography.Text type="secondary">
              Informasi pengiriman tidak tersedia
            </Typography.Text>
          )}

          <Divider orientation="left" style={{ margin: "24px 0 16px" }}>
            Produk
          </Divider>

          {(() => {
            const parseItemAttributes = (d: any) => {
              const rawAttributes = d.attributes;
              if (!rawAttributes) return null;
              if (typeof rawAttributes === "string") {
                try {
                  return JSON.parse(rawAttributes);
                } catch {
                  return null;
                }
              }
              return rawAttributes;
            };

            const items = selectedTx.details || [];
            const { regularItems, giftItems } =
              extractGiftsFromDetails(items);

            const getCols = (isGift: boolean) => [
              {
                title: isGift ? "Hadiah" : "Produk",
                key: "product",
                render: (_: any, d: any) => {
                  const parsedAttr = parseItemAttributes(d);
                  const brand = isGift
                    ? parsedAttr?.brand_name ||
                      (d.product as any)?.brand?.name ||
                      "-"
                    : (d.product as any)?.brand?.name ||
                      parsedAttr?.brand_name ||
                      "-";
                  const productName = isGift
                    ? parsedAttr?.name ||
                      d.name ||
                      d.product?.name ||
                      "Produk Hadiah"
                    : d.product?.name ||
                      d.name ||
                      parsedAttr?.name ||
                      "Produk";
                  const finalVariantName = getProductVariantDisplay(
                    d,
                    isGift,
                  );

                  const img = isGift
                    ? d.product?.thumbnail ||
                      parsedAttr?.image_url ||
                      parsedAttr?.imageUrl ||
                      parsedAttr?.thumbnail ||
                      d.product?.medias?.[0]?.url ||
                      ""
                    : d.product?.thumbnail ||
                      d.product?.medias?.[0]?.url ||
                      "";

                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          style={{
                            width: 40,
                            height: 40,
                            minWidth: 40,
                            objectFit: "cover",
                            borderRadius: 4,
                            border: "1px solid #eee",
                          }}
                        />
                      ) : isGift ? (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            minWidth: 40,
                            background: "#fff1f0",
                            border: "1px dashed #ffa39e",
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <GiftFilled
                            style={{ fontSize: 16, color: "#cf1322" }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            minWidth: 40,
                            background: "#f5f5f5",
                            borderRadius: 4,
                          }}
                        />
                      )}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {isGift && (
                            <Tag
                              color="green"
                              style={{
                                margin: 0,
                                fontSize: 10,
                                lineHeight: "16px",
                                height: 18,
                              }}
                            >
                              GIFT
                            </Tag>
                          )}
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: 12, fontWeight: 500 }}
                          >
                            {brand}
                          </Typography.Text>
                        </div>
                        <Typography.Text strong style={{ fontSize: 13 }}>
                          {productName}
                        </Typography.Text>
                        {finalVariantName && (
                          <Typography.Text
                            style={{ fontSize: 11, color: "#666" }}
                          >
                            Varian: {finalVariantName}
                          </Typography.Text>
                        )}
                      </div>
                    </div>
                  );
                },
              },
              {
                title: "Variasi",
                key: "variant",
                width: 120,
                render: (_: any, d: any) => {
                  if (isGift) {
                    // Untuk hadiah: ekstrak variasi dari nama gift
                    // Format selalu: "Brand - Product - Variant"
                    const attr =
                      d.attributes && typeof d.attributes === "string"
                        ? (() => {
                            try {
                              return JSON.parse(d.attributes);
                            } catch {
                              return {};
                            }
                          })()
                        : d.attributes || {};
                    const giftName =
                      attr?.gift_name ||
                      attr?.name ||
                      d.product?.name ||
                      d.name ||
                      "";
                    if (giftName) {
                      const parts = giftName.split(" - ");
                      if (parts.length >= 3) {
                        // Ambil dari segment terakhir sebagai variant
                        const variant = parts.slice(2).join(" - ").trim();
                        const clean =
                          variant.toLowerCase() === "default" ? "" : variant;
                        if (clean) return clean;
                      }
                    }
                    return "-";
                  }
                  // Non-gift: selalu ambil dari variant.attributes[].value
                  if (d.variant?.attributes) {
                    let vAttrs = d.variant.attributes;
                    if (typeof vAttrs === "string") {
                      try {
                        vAttrs = JSON.parse(vAttrs);
                      } catch {
                        vAttrs = [];
                      }
                    }
                    if (Array.isArray(vAttrs) && vAttrs.length > 0) {
                      const vals = vAttrs
                        .map(
                          (a: any) =>
                            a?.value ||
                            a?.attribute_value ||
                            a?.attributeValue ||
                            "",
                        )
                        .filter(
                          (v: string) =>
                            v && v.trim().toLowerCase() !== "default",
                        );
                      if (vals.length > 0) return vals.join(" / ");
                    }
                  }
                  // Fallback ke getProductVariantDisplay
                  const variantName = getProductVariantDisplay(d, isGift);
                  return variantName || "-";
                },
              },
              {
                title: "SKU / Barcode",
                key: "sku",
                width: 180,
                render: (_: any, d: any) => {
                  if (isGift) {
                    // Untuk hadiah: ambil dari attributes (gift_sku) / product.sku
                    const attr =
                      d.attributes && typeof d.attributes === "string"
                        ? (() => {
                            try {
                              return JSON.parse(d.attributes);
                            } catch {
                              return {};
                            }
                          })()
                        : d.attributes || {};
                    const sku =
                      attr?.gift_sku ||
                      attr?.sku ||
                      d.product?.sku ||
                      d.variant?.sku ||
                      "-";
                    return <Typography.Text code>{sku}</Typography.Text>;
                  }
                  // Non-gift: selalu prioritaskan variant.barcode
                  const barcode = d.variant?.barcode || d.variant?.sku || "-";
                  return <Typography.Text code>{barcode}</Typography.Text>;
                },
              },
              {
                title: "Qty",
                dataIndex: "qty",
                key: "qty",
                width: 60,
                align: "center" as const,
                render: (v: any) => <b>x{v}</b>,
              },
            ];

            return (
              <Space direction="vertical" style={{ width: "100%" }} size={24}>
                {regularItems.length > 0 && (
                  <Table
                    size="small"
                    pagination={false}
                    dataSource={regularItems}
                    rowKey={(_, i) => `reg-${i}`}
                    bordered
                    columns={getCols(false) as any}
                  />
                )}
                {giftItems.length > 0 && (
                  <Table
                    size="small"
                    pagination={false}
                    dataSource={giftItems}
                    rowKey={(_, i) => `gift-${i}`}
                    bordered
                    columns={getCols(true) as any}
                  />
                )}
              </Space>
            );
          })()}
        </div>
      )}
    </Modal>
  );
}
