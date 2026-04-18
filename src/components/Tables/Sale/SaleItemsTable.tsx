import React from "react";
import { Badge, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  GiftOutlined,
  PercentageOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import type { SaleRecord } from "../../Forms/Sale/saleTypes";
import type { SaleItem, ProductGroupRow } from "../../../hooks/useTableSale";
import {
  calcPercentOff,
  formatRp,
  getPromoItems,
  groupPromoItems,
  isPromoStockInactive,
  isPublished,
  toNumSafe,
} from "../../../hooks/useTableSale";

const SaleItemsTable: React.FC<{ sale: SaleRecord }> = ({ sale }) => {
  const items = getPromoItems(sale);
  const groups = groupPromoItems(items);

  const cols: ColumnsType<SaleItem> = [
    {
      title: (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <AppstoreOutlined />
          Produk/Varian
        </span>
      ),
      key: "variant",
      width: 240,
      render: (_: unknown, it) => {
        const label = String(it.label ?? it.sku ?? "-");
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#262626", fontSize: 13 }}>
              {label}
            </span>
            {it.sku && (
              <span
                style={{
                  fontSize: 11,
                  color: "#8c8c8c",
                  fontFamily: "monospace",
                }}
              >
                SKU: {it.sku}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
          }}
        >
          <TagsOutlined />
          <span>Harga Normal</span>
        </span>
      ),
      key: "basePrice",
      align: "right",
      width: 140,
      render: (_: unknown, it) => {
        const base = toNumSafe(it.basePrice, 0);
        return base ? (
          <span style={{ color: "#262626", fontWeight: 500 }}>
            {formatRp(base)}
          </span>
        ) : (
          <span style={{ color: "#d9d9d9" }}>-</span>
        );
      },
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
          }}
        >
          <GiftOutlined />
          <span>Harga Promo</span>
        </span>
      ),
      key: "after",
      align: "right",
      width: 150,
      render: (_: unknown, it) => {
        const base = toNumSafe(it.basePrice, 0);
        const salePrice = it.salePrice;
        if (isPromoStockInactive(it.promoStock)) {
          return base ? (
            <span style={{ color: "#8c8c8c", textDecoration: "line-through" }}>
              {formatRp(base)}
            </span>
          ) : (
            <span style={{ color: "#d9d9d9" }}>-</span>
          );
        }
        return salePrice === null || salePrice === undefined ? (
          <span style={{ color: "#d9d9d9" }}>-</span>
        ) : (
          <span style={{ color: "#ff4d4f", fontWeight: 700, fontSize: 14 }}>
            {formatRp(salePrice)}
          </span>
        );
      },
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <PercentageOutlined />
          <span>Diskon</span>
        </span>
      ),
      key: "discount",
      align: "center",
      width: 110,
      render: (_: unknown, it) => {
        const base = toNumSafe(it.basePrice, 0);
        const salePrice = it.salePrice;
        if (
          !base ||
          salePrice === null ||
          salePrice === undefined ||
          isPromoStockInactive(it.promoStock)
        )
          return <span style={{ color: "#d9d9d9" }}>-</span>;
        const pct = calcPercentOff(base, salePrice);
        return pct === null ? (
          <span style={{ color: "#d9d9d9" }}>-</span>
        ) : (
          <Tag color="red" style={{ fontWeight: 700, fontSize: 12 }}>
            -{pct}%
          </Tag>
        );
      },
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <AppstoreOutlined />
          <span>Stok Tersedia</span>
        </span>
      ),
      key: "stock",
      width: 130,
      align: "center",
      render: (_: unknown, it) => {
        const stock = toNumSafe(it.baseStock, 0);
        return Number.isFinite(stock) ? (
          <Badge
            count={stock}
            showZero
            color={stock > 0 ? "#52c41a" : "#d9d9d9"}
            style={{ fontWeight: 600, fontSize: 12 }}
          />
        ) : (
          <span style={{ color: "#d9d9d9" }}>-</span>
        );
      },
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <GiftOutlined />
          <span>Stok Promo</span>
        </span>
      ),
      key: "promoStock",
      align: "center",
      width: 140,
      render: (_: unknown, it) => {
        if (it.promoStock === null || it.promoStock === undefined)
          return <span style={{ color: "#d9d9d9" }}>-</span>;
        const stock = toNumSafe(it.promoStock, 0);
        return (
          <Badge
            count={stock}
            showZero
            color={stock > 0 ? "#1890ff" : "#d9d9d9"}
            style={{ fontWeight: 600, fontSize: 12 }}
          />
        );
      },
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <CheckCircleOutlined />
          <span>Status</span>
        </span>
      ),
      key: "status",
      align: "center",
      width: 110,
      render: (_: unknown, it) => {
        const inactive =
          !isPublished(sale) || isPromoStockInactive(it.promoStock);
        return inactive ? (
          <Tag color="error" style={{ fontWeight: 600 }}>
            Nonaktif
          </Tag>
        ) : (
          <Tag
            color="success"
            icon={<CheckCircleOutlined />}
            style={{ fontWeight: 600 }}
          >
            Aktif
          </Tag>
        );
      },
    },
  ];

  if (!items.length) {
    return (
      <div
        style={{
          padding: 24,
          color: "#8c8c8c",
          textAlign: "center",
          background: "#fafafa",
          borderRadius: 6,
          border: "1px dashed #d9d9d9",
        }}
      >
        <p style={{ fontSize: 14, marginBottom: 4 }}>
          📭 Tidak ada item dalam promosi ini
        </p>
        <p style={{ fontSize: 12, margin: 0, opacity: 0.7 }}>
          Tambahkan produk untuk melihat detail varian
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "12px 16px",
        background: "#fafafa",
        borderRadius: 4,
        marginTop: 8,
      }}
    >
      <Table<ProductGroupRow>
        size="small"
        rowKey="key"
        dataSource={groups}
        pagination={false}
        bordered
        style={{ borderRadius: 6, overflow: "hidden" }}
        columns={[
          {
            title: (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <AppstoreOutlined style={{ fontSize: 14 }} />
                <span>Nama Produk</span>
              </span>
            ),
            dataIndex: "productName",
            key: "productName",
            render: (_: unknown, group) => (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {String(group.productName).charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#262626",
                      fontSize: 13,
                    }}
                  >
                    {group.productName}
                  </div>
                </div>
              </div>
            ),
          },
          {
            title: (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <TagsOutlined style={{ fontSize: 14 }} />
                <span>Harga Normal</span>
              </span>
            ),
            key: "base",
            width: 140,
            align: "right",
            render: () => null,
          },
          {
            title: (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <GiftOutlined style={{ fontSize: 14 }} />
                <span>Harga Promo</span>
              </span>
            ),
            key: "salePrice",
            width: 150,
            align: "right",
            render: () => null,
          },
          {
            title: (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <PercentageOutlined style={{ fontSize: 14 }} />
                <span>Diskon</span>
              </span>
            ),
            key: "discount",
            width: 110,
            align: "center",
            render: () => null,
          },
          {
            title: (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <AppstoreOutlined style={{ fontSize: 14 }} />
                <span>Stok Tersedia</span>
              </span>
            ),
            key: "stock",
            width: 130,
            align: "center",
            render: () => null,
          },
          {
            title: (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <GiftOutlined style={{ fontSize: 14 }} />
                <span>Stok Promo</span>
              </span>
            ),
            key: "promoStock",
            width: 140,
            align: "center",
            render: () => null,
          },
          {
            title: (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <CheckCircleOutlined style={{ fontSize: 14 }} />
                <span>Status</span>
              </span>
            ),
            key: "status",
            width: 110,
            align: "center",
            render: () => null,
          },
        ]}
        expandable={{
          defaultExpandAllRows: true,
          expandedRowRender: (group) => (
            <div style={{ marginLeft: -8, marginRight: -8 }}>
              <Table<SaleItem>
                size="small"
                columns={cols}
                dataSource={group.variants}
                pagination={false}
                rowKey="__key"
                showHeader={true}
                bordered
                style={{
                  background: "#fff",
                }}
              />
            </div>
          ),
        }}
      />
    </div>
  );
};

export default SaleItemsTable;
