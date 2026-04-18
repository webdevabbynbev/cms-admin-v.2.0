import {
  Modal,
  Space,
  Button,
  Card,
  Steps,
  Row,
  Col,
  Descriptions,
  Table,
  Tag,
  Typography,
  Divider,
  Timeline,
} from "antd";
import dayjs from "dayjs";
import { GiftFilled } from "@ant-design/icons";
import {
  extractGiftsFromDetails,
  getProductVariantDisplay,
} from "../../utils/b1g1GiftUtils";
import { formatDate, money, getTransactionStepCurrent } from "./transactionUtils";
import type { Tx } from "./transactionUtils";

interface OrderManagementModalProps {
  visible: boolean;
  onCancel: () => void;
  selectedTx: Tx | null;
  downloadInvoice: (id: number, mode: "print" | "download") => void;
  setSearchParams: (fn: (prev: URLSearchParams) => URLSearchParams) => void;
  trackingLoading: boolean;
  trackingData: any;
}

export default function OrderManagementModal({
  visible,
  onCancel,
  selectedTx,
  downloadInvoice,
  setSearchParams,
  trackingLoading,
  trackingData,
}: OrderManagementModalProps) {
  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingRight: 24,
          }}
        >
          <span>Manajemen Pesanan</span>
          <Space>
            <Button
              onClick={() => {
                if (selectedTx) downloadInvoice(selectedTx.id, "print");
              }}
            >
              Cetak Invoice
            </Button>
          </Space>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1100}
      centered
      destroyOnClose
    >
      {selectedTx && (
        <div style={{ padding: "0 10px" }}>
          {/* Status Tracker */}
          <Card style={{ marginBottom: 24, borderRadius: 12 }}>
            <Steps
              current={getTransactionStepCurrent(selectedTx.transactionStatus)}
              size="small"
              items={[
                { title: "Pesanan Dibuat" },
                { title: "Pembayaran" },
                { title: "Diproses" },
                { title: "Dikirim" },
                { title: "Selesai" },
              ]}
            />
          </Card>

          <Row gutter={24}>
            {/* Left Column: Order & Payment Info */}
            <Col span={15}>
              {/* Order Info (MATCHING IMAGE 4) */}
              <Card
                style={{ marginBottom: 24, borderRadius: 12 }}
                bodyStyle={{ padding: 20 }}
              >
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item
                    label="No. Transaksi"
                    labelStyle={{ fontWeight: 600, width: 150 }}
                  >
                    <span style={{ fontWeight: 700 }}>
                      {selectedTx.transactionNumber}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Customer"
                    labelStyle={{ fontWeight: 600 }}
                  >
                    {selectedTx.user?.fullName ||
                      selectedTx.user?.name ||
                      "-"}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Kontak"
                    labelStyle={{ fontWeight: 600 }}
                  >
                    {selectedTx.user?.email} / {selectedTx.user?.phone || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Waktu Order"
                    labelStyle={{ fontWeight: 600 }}
                  >
                    {formatDate(
                      selectedTx.createdAt || (selectedTx as any).created_at,
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Metode Pembayaran"
                    labelStyle={{ fontWeight: 600 }}
                  >
                    <span style={{ textTransform: "uppercase" }}>
                      {(selectedTx as any).ecommerce?.paymentMethod ||
                        (selectedTx as any).paymentMethod ||
                        "MANUAL TRANSFER"}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Product List Section (CLEAN VERSION) */}
              <Card
                title="Daftar Produk"
                style={{ marginBottom: 24, borderRadius: 12 }}
                bodyStyle={{ padding: 24 }}
              >
                {(() => {
                  const parseItemAttr = (d: any) => {
                    const raw = d.attributes;
                    if (!raw) return null;
                    if (typeof raw === "string") {
                      try {
                        return JSON.parse(raw);
                      } catch {
                        return null;
                      }
                    }
                    return raw;
                  };

                  const items = selectedTx.details || [];
                  const { regularItems, giftItems } =
                    extractGiftsFromDetails(items);

                  const getProductColumns = (isGift: boolean) => [
                    {
                      title: isGift ? "Hadiah" : "Produk",
                      key: "product",
                      width: 250,
                      render: (_: any, d: any) => {
                        const attr = parseItemAttr(d);
                        // FIX GIFT DESYNC: Prioritize attributes name for gifts
                        const productName = isGift
                          ? attr?.name ||
                            d.name ||
                            d.product?.name ||
                            "Produk Hadiah"
                          : d.product?.name ||
                            d.name ||
                            attr?.name ||
                            "Produk";

                        const brandName = isGift
                          ? attr?.brand_name ||
                            (d.product as any)?.brand?.name ||
                            ""
                          : (d.product as any)?.brand?.name ||
                            attr?.brand_name ||
                            "";
                        const img = isGift
                          ? attr?.image_url ||
                            attr?.imageUrl ||
                            attr?.thumbnail ||
                            attr?.image ||
                            d.product?.thumbnail ||
                            d.product?.medias?.[0]?.url ||
                            d.product?.image ||
                            ""
                          : d.product?.thumbnail ||
                            d.product?.medias?.[0]?.url ||
                            d.product?.image ||
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
                                  width: 48,
                                  height: 48,
                                  minWidth: 48,
                                  objectFit: "cover",
                                  borderRadius: 6,
                                  border: "1px solid #eee",
                                }}
                              />
                            ) : isGift ? (
                              <div
                                style={{
                                  width: 48,
                                  height: 48,
                                  minWidth: 48,
                                  background: "#fff1f0",
                                  border: "1px dashed #ffa39e",
                                  borderRadius: 6,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <GiftFilled
                                  style={{ fontSize: 18, color: "#cf1322" }}
                                />
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: 48,
                                  height: 48,
                                  minWidth: 48,
                                  background: "#f5f5f5",
                                  borderRadius: 6,
                                }}
                              />
                            )}
                            <div>
                              {isGift && (
                                <Tag
                                  color="green"
                                  style={{
                                    fontSize: 9,
                                    marginBottom: 4,
                                    lineHeight: "14px",
                                    height: 16,
                                  }}
                                >
                                  GIFT
                                </Tag>
                              )}
                              {!isGift &&
                                (attr?.is_b1g1 ||
                                  attr?.buyOneGetOneItemId) && (
                                  <Tag
                                    color="blue"
                                    style={{
                                      fontSize: 9,
                                      marginBottom: 4,
                                      lineHeight: "14px",
                                      height: 16,
                                    }}
                                  >
                                    B1G1
                                  </Tag>
                                )}
                              <div style={{ fontSize: 11, color: "#888" }}>
                                {brandName}
                              </div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>
                                {productName}
                              </div>
                            </div>
                          </div>
                        );
                      },
                    },
                    {
                      title: "Variasi",
                      key: "variant",
                      width: 100,
                      render: (_: any, d: any) => {
                        const isGift =
                          d.isGiftItem === true ||
                          d.is_gift_item === true ||
                          d.is_b1g1_gift === true;
                        const variantName = getProductVariantDisplay(
                          d,
                          isGift,
                        );
                        return variantName || "-";
                      },
                    },
                    {
                      title: "Harga Satuan",
                      key: "price",
                      align: "right" as const,
                      width: 120,
                      render: (_: any, d: any) => {
                        if (isGift) return "Rp 0";
                        const price = Number(d.price);
                        const discount = Number(d.discount || 0);
                        if (discount > 0) {
                          const unitAmt =
                            (Number(d.amount) || price * d.qty - discount) /
                            d.qty;
                          return (
                            <div
                              style={{
                                textAlign: "right",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                              }}
                            >
                              <Typography.Text
                                delete
                                type="secondary"
                                style={{ fontSize: 11, color: "#aaa" }}
                              >
                                Rp {money(price)}
                              </Typography.Text>
                              <span style={{ fontWeight: 500 }}>
                                Rp {money(unitAmt)}
                              </span>
                            </div>
                          );
                        }
                        return `Rp ${money(price)}`;
                      },
                    },
                    {
                      title: "Jumlah",
                      dataIndex: "qty",
                      key: "qty",
                      align: "center" as const,
                      width: 80,
                      render: (v: any) => <b>x{v}</b>,
                    },
                    {
                      title: "Subtotal",
                      key: "subtotal",
                      align: "right" as const,
                      width: 120,
                      render: (_: any, d: any) => {
                        if (isGift) return "Rp 0";
                        const origSubtotal = Number(d.price) * d.qty;
                        const discount = Number(d.discount || 0);
                        if (discount > 0) {
                          const amt =
                            Number(d.amount) || origSubtotal - discount;
                          return (
                            <div
                              style={{
                                textAlign: "right",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                              }}
                            >
                              <Typography.Text
                                delete
                                type="secondary"
                                style={{ fontSize: 11, color: "#aaa" }}
                              >
                                Rp {money(origSubtotal)}
                              </Typography.Text>
                              <span style={{ fontWeight: 500 }}>
                                Rp {money(amt)}
                              </span>
                            </div>
                          );
                        }
                        return `Rp ${money(origSubtotal)}`;
                      },
                    },
                  ];

                  return (
                    <Space
                      direction="vertical"
                      style={{ width: "100%" }}
                      size={24}
                    >
                      {regularItems.length > 0 && (
                        <Table
                          size="small"
                          pagination={false}
                          dataSource={regularItems}
                          rowKey={(_, i) => `reg-${i}`}
                          columns={getProductColumns(false) as any}
                        />
                      )}
                      {giftItems.length > 0 && (
                        <Table
                          size="small"
                          pagination={false}
                          dataSource={giftItems}
                          rowKey={(_, i) => `gift-${i}`}
                          columns={getProductColumns(true) as any}
                        />
                      )}
                    </Space>
                  );
                })()}
              </Card>

              {/* Payment Breakdown Card */}
              <Card
                title="Informasi Pembayaran"
                style={{ borderRadius: 12 }}
                bodyStyle={{ padding: 24, background: "#fafafa" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 12,
                  }}
                >
                  <Typography.Link
                    style={{ fontSize: 12 }}
                    onClick={() => {
                      const userId = selectedTx.user?.id;
                      if (userId) {
                        setSearchParams((prev) => {
                          prev.delete("status");
                          prev.delete("transaction_number");
                          prev.set("user", String(userId));
                          prev.set("page", "1");
                          return prev;
                        });
                        onCancel();
                      }
                    }}
                  >
                    Lihat riwayat transaksi
                  </Typography.Link>
                </div>

                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size={8}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography.Text type="secondary">
                      Subtotal Pesanan
                    </Typography.Text>
                    <Typography.Text strong>
                      Rp{" "}
                      {money(
                        (selectedTx as any).itemsSubtotal ||
                          (selectedTx as any).subTotal ||
                          (selectedTx as any).sub_total ||
                          (selectedTx.details || []).reduce(
                            (acc: number, d: any) =>
                              acc + Number(d.price || 0) * Number(d.qty || 1),
                            0,
                          ),
                      )}
                    </Typography.Text>
                  </div>
                  {(() => {
                    const shippingCost = Number(
                      (selectedTx as any).shippingCost ||
                        (selectedTx as any).shipping_cost ||
                        (selectedTx as any).ecommerce?.shippingCost ||
                        (selectedTx as any).shipments?.[0]?.price ||
                        0,
                    );

                    const totalDiscount = Number(
                      (selectedTx as any).discountTotal ||
                        (selectedTx as any).discountAmount ||
                        (selectedTx as any).discount ||
                        0,
                    );

                    // 1. Calculate explicit product discount from `details`
                    const details = selectedTx.details || [];
                    const diskonProduk = details
                      .filter((d: any) => Number(d.price) > 0)
                      .reduce(
                        (acc: number, d: any) =>
                          acc + Number(d.discount || 0),
                        0,
                      );

                    // 2. See how much total discount is remaining
                    const remainingDiscount = Math.max(
                      0,
                      totalDiscount - diskonProduk,
                    );

                    // 3. We know that up to max `shippingCost` (capped at 10,000) from the remaining could be the shipping voucher.
                    const maxShippingDiscount = Math.min(shippingCost, 10000);

                    let diskonVoucherOngkir = remainingDiscount;
                    if (diskonVoucherOngkir > maxShippingDiscount) {
                      diskonVoucherOngkir = maxShippingDiscount;
                    }

                    // 4. Any leftover from the remaining after taking shipping discount goes to "Diskon Voucher Belanja"
                    let diskonVoucherBelanja =
                      remainingDiscount - diskonVoucherOngkir;

                    if (diskonVoucherBelanja < 0) diskonVoucherBelanja = 0;

                    const ongkirDibayarPembeli =
                      shippingCost - diskonVoucherOngkir;

                    return (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography.Text type="secondary">
                            Ongkos Pengiriman
                          </Typography.Text>
                          <Typography.Text strong>
                            Rp {money(shippingCost)}
                          </Typography.Text>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography.Text type="secondary">
                            Diskon Produk
                          </Typography.Text>
                          <Typography.Text
                            type={diskonProduk > 0 ? "danger" : undefined}
                            strong
                          >
                            {diskonProduk > 0 ? "- " : ""}Rp{" "}
                            {money(diskonProduk)}
                          </Typography.Text>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography.Text type="secondary">
                            Diskon Voucher Belanja
                          </Typography.Text>
                          <Typography.Text
                            type={
                              diskonVoucherBelanja > 0 ? "danger" : undefined
                            }
                            strong
                          >
                            {diskonVoucherBelanja > 0 ? "- " : ""}Rp{" "}
                            {money(diskonVoucherBelanja)}
                          </Typography.Text>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography.Text type="secondary">
                            Ongkir Dibayar Pembeli
                          </Typography.Text>
                          <Typography.Text strong>
                            Rp {money(ongkirDibayarPembeli)}
                          </Typography.Text>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography.Text type="secondary">
                            Diskon Voucher Ongkir
                          </Typography.Text>
                          <Typography.Text
                            type={
                              diskonVoucherOngkir > 0 ? "danger" : undefined
                            }
                            strong
                          >
                            {diskonVoucherOngkir > 0 ? "- " : ""}Rp{" "}
                            {money(diskonVoucherOngkir)}
                          </Typography.Text>
                        </div>
                      </>
                    );
                  })()}
                  <Divider style={{ margin: "8px 0" }} />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography.Title
                      level={5}
                      style={{ margin: 0, color: "#9B3C6C" }}
                    >
                      Total Pembayaran
                    </Typography.Title>
                    <Typography.Title
                      level={5}
                      style={{ margin: 0, color: "#9B3C6C" }}
                    >
                      Rp {money(selectedTx.amount)}
                    </Typography.Title>
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      padding: 12,
                      background: "#fff",
                      borderRadius: 8,
                      border: "1px dashed #d9d9d9",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 13 }}
                      >
                        Estimasi Ongkos Kirim (Biteship)
                      </Typography.Text>
                      <Typography.Text style={{ fontSize: 13 }}>
                        - Rp {money(selectedTx.shipments?.[0]?.price || 0)}
                      </Typography.Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 13 }}
                      >
                        Biaya Administrasi
                      </Typography.Text>
                      <Typography.Text style={{ fontSize: 13 }}>
                        Rp 0
                      </Typography.Text>
                    </div>
                    <Divider style={{ margin: "8px 0" }} />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        background: "#fff1f0",
                        padding: "8px 12px",
                        borderRadius: 4,
                      }}
                    >
                      <Typography.Text strong>
                        Estimasi Total Penghasilan
                      </Typography.Text>
                      <Typography.Text strong style={{ color: "#9B3C6C" }}>
                        Rp{" "}
                        {money(
                          Number(selectedTx.amount) -
                            Number(selectedTx.shipments?.[0]?.price || 0),
                        )}
                      </Typography.Text>
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>

            {/* Right Column: Shipment & Tracking */}
            <Col span={9}>
              <Card
                title="Informasi Pengiriman"
                style={{ marginBottom: 24, borderRadius: 12 }}
              >
                <Descriptions column={1} size="small" colon={false}>
                  <Descriptions.Item
                    label={
                      <Typography.Text type="secondary">
                        Kurir
                      </Typography.Text>
                    }
                  >
                    <Typography.Text strong>
                      {selectedTx.shipments?.[0]?.service || "-"}
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <Typography.Text type="secondary">
                        No. Resi
                      </Typography.Text>
                    }
                  >
                    <Typography.Text strong>
                      {selectedTx.shipments?.[0]?.resiNumber ||
                        (selectedTx.shipments?.[0] as any)?.resi_number ||
                        "-"}
                    </Typography.Text>
                  </Descriptions.Item>
                </Descriptions>

                <Divider style={{ margin: "16px 0" }} />

                <Typography.Text
                  strong
                  style={{ display: "block", marginBottom: 12 }}
                >
                  Status Pengiriman
                </Typography.Text>

                {trackingLoading ? (
                  <Typography.Text type="secondary">
                    Memuat timeline...
                  </Typography.Text>
                ) : trackingData?.history &&
                  trackingData.history.length > 0 ? (
                  <Timeline
                    mode="left"
                    style={{ marginTop: 16 }}
                    items={trackingData.history.map((h: any, idx: number) => {
                      const getTrackingStatusLabel = (s: string) => {
                        const map: Record<string, string> = {
                          confirmed: "Pesanan Dikonfirmasi",
                          allocated: "Kurir Dialokasikan",
                          picking_up:
                            "Kurir Sedang Menuju Lokasi Penjemputan",
                          picked: "Paket Telah Dijemput",
                          dropping_off: "Paket Sedang Dikirim",
                          shipped: "Paket Diterima di Hub",
                          delivered: "Paket Diterima",
                          canceled: "Pengiriman Dibatalkan",
                          return_in_transit:
                            "Paket Dikembalikan (Dalam Transit)",
                          returned: "Paket Telah Dikembalikan",
                        };
                        return map[s.toLowerCase()] || s;
                      };

                      const isLatest = idx === 0;
                      return {
                        color: isLatest ? "#9B3C6C" : "gray",
                        children: (
                          <div style={{ paddingBottom: 8 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: isLatest ? "#333" : "#888",
                                marginBottom: 2,
                              }}
                            >
                              {getTrackingStatusLabel(h.status)}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: isLatest ? "#555" : "#999",
                                lineHeight: "18px",
                                marginBottom: 4,
                              }}
                            >
                              {h.note || h.status_detail || "-"}
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.6 }}>
                              {dayjs(h.timestamp).format(
                                "DD MMM YYYY, HH:mm",
                              )}
                              {h.location && ` - ${h.location}`}
                            </div>
                          </div>
                        ),
                      };
                    })}
                  />
                ) : (
                  <Typography.Text type="secondary">
                    Belum ada riwayat pelacakan.
                  </Typography.Text>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </Modal>
  );
}
