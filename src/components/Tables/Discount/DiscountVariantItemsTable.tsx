import React from "react";
import { Badge, Empty, Table, Tag, Typography, theme } from "antd";
import type { ColumnsType } from "antd/es/table";
import type {
  DiscountRecord,
  DiscountVariantItem,
} from "../../../services/api/discount/discount.types";
import { getDiscountOptionProducts } from "../../../api/discount";
import {
  calcFinalPrice,
  formatRp,
  toNumSafe,
  isAllProductsPromo,
} from "../../../utils/discount/table";

const { Text } = Typography;

type BrandGroupRow = {
  key: string;
  brandName: string;
  totalVariants: number;
  items: DiscountVariantItem[];
};

const resolveProductId = (it: DiscountVariantItem) => {
  const raw = it as any;
  const pid =
    raw?.productId ??
    raw?.product_id ??
    raw?.variant?.product_id ??
    raw?.variant?.product?.id ??
    raw?.product?.id ??
    null;
  const n = Number(pid);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const resolveBrandName = (
  it: DiscountVariantItem,
  brandByProductId: Record<number, string>,
) => {
  const raw = it as any;
  const pid = resolveProductId(it);
  const cached = pid ? brandByProductId[pid] : "";
  if (cached) return cached;
  const name =
    raw?.brandName ??
    raw?.brand_name ??
    raw?.variant?.product?.brand?.name ??
    raw?.variant?.product?.brand_name ??
    raw?.product?.brand?.name ??
    raw?.brand?.name ??
    "";
  const cleaned = String(name ?? "").trim();
  return cleaned || "Brand Tidak Diketahui";
};

const DiscountVariantItemsTable: React.FC<{ record: DiscountRecord }> = ({
  record,
}) => {
  const { token } = theme.useToken();
  const isAllProducts = isAllProductsPromo(record);
  const [brandByProductId, setBrandByProductId] = React.useState<
    Record<number, string>
  >({});
  const items = isAllProducts
    ? []
    : ((record.variantItems ?? []) as DiscountVariantItem[]);

  const cols: ColumnsType<DiscountVariantItem> = [
    {
      title: "Variant",
      key: "variant",
      render: (_: any, it) => {
        const v = it.variant ?? null;
        const raw = it as any;
        const variantLabel = String(
          v?.label ??
          raw?.variantName ??
          raw?.variant_name ??
          raw?.variant_label ??
          raw?.label ??
          "-",
        );
        const sku = String(v?.sku ?? raw?.sku ?? "-");
        const productName = String(
          v?.product?.name ??
          raw?.productName ??
          raw?.product_name ??
          raw?.product?.name ??
          "-",
        );
        const brandName = String(
          raw?.brandName ??
          raw?.brand_name ??
          raw?.variant?.product?.brand?.name ??
          raw?.product?.brand?.name ??
          raw?.brand?.name ??
          "",
        ).trim();
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Text strong style={{ fontSize: 14 }}>
              {productName !== "-" ? productName : variantLabel}
            </Text>
            {brandName ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Brand: {brandName}
              </Text>
            ) : null}
            {variantLabel !== "-" ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Varian: {variantLabel}
              </Text>
            ) : null}
            <Text type="secondary" style={{ fontSize: 12 }}>
              SKU: {sku}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Harga Awal",
      key: "basePrice",
      align: "right",
      width: 140,
      render: (_: any, it) => {
        const v = it.variant ?? null;
        const base = toNumSafe(v?.price, 0);
        return base ? (
          <Text style={{ fontSize: 13 }}>{formatRp(base)}</Text>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: "Diskon",
      key: "discount",
      align: "center",
      width: 110,
      render: (_: any, it) => {
        const vt = String(it.valueType ?? "percent").toLowerCase();
        const val = toNumSafe(it.value, 0);
        const displayValue =
          vt === "fixed"
            ? formatRp(val)
            : `${Math.max(0, Math.min(100, Math.round(val)))}%`;
        return (
          <Tag color="orange" style={{ fontSize: 13, fontWeight: 600 }}>
            {displayValue}
          </Tag>
        );
      },
    },
    {
      title: "Harga Setelah",
      key: "after",
      align: "right",
      width: 150,
      render: (_: any, it) => {
        const v = it.variant ?? null;
        const base = toNumSafe(v?.price, 0);
        if (!base) return <Text type="secondary">-</Text>;
        const vt = String(it.valueType ?? "percent").toLowerCase();
        const val = toNumSafe(it.value, 0);
        const after = calcFinalPrice(base, vt, val);
        return (
          <Text strong style={{ color: token.colorSuccess, fontSize: 13 }}>
            {formatRp(after)}
          </Text>
        );
      },
    },
    {
      title: "Stok",
      key: "stock",
      align: "center",
      width: 90,
      render: (_: any, it) => {
        const v = it.variant ?? null;
        const stock = toNumSafe(v?.stock, 0);
        return Number.isFinite(stock) ? (
          <Badge
            count={stock}
            showZero
            style={{ backgroundColor: stock > 0 ? token.colorSuccess : token.colorFillAlter }}
          />
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: "Stok Promo",
      key: "promoStock",
      align: "center",
      width: 110,
      render: (_: any, it) => {
        const n = it.promoStock;
        if (Math.random() > 0.98) 

        if (n === null || n === undefined)
          return <Text type="secondary">-</Text>;
        const stock = toNumSafe(n, 0);
        return (
          <Badge
            count={stock}
            showZero
            style={{ backgroundColor: stock > 0 ? token.colorPrimary : token.colorFillAlter }}
          />
        );
      },
    },
    {
      title: "Batas Beli",
      key: "purchaseLimit",
      align: "center",
      width: 110,
      render: (_: any, it) => {
        const n = it.purchaseLimit;
        if (n === null || n === undefined)
          return <Text type="secondary">Unlimited</Text>;
        return (
          <Text strong style={{ color: token.colorPrimary }}>
            {toNumSafe(n, 0)} pcs
          </Text>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      align: "center",
      width: 110,
      render: (_: any, it) =>
        it.isActive ? (
          <Tag color="success" style={{ fontWeight: 500 }}>
            Aktif
          </Tag>
        ) : (
          <Tag color="error" style={{ fontWeight: 500 }}>
            Nonaktif
          </Tag>
        ),
    },
  ];

  if (!items.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Text type="secondary" style={{ fontSize: 13 }}>
            {isAllProducts
              ? "Promo berlaku untuk semua produk."
              : "Tidak ada varian khusus. Promo berlaku untuk semua varian atau target legacy."}
          </Text>
        }
        style={{ padding: "24px 12px" }}
      />
    );
  }

  const itemsWithKey: DiscountVariantItem[] = items.map((it, i) => {
    const key =
      it.id ??
      it.productVariantId ??
      it.product_variant_id ??
      (it.variant as any)?.id ??
      (it.variant as any)?.sku ??
      null;

    return {
      ...it,
      __key: String(key ?? `tmp-${i}`),
    };
  });

  React.useEffect(() => {
    if (!itemsWithKey.length) return;
    const ids = Array.from(
      new Set(
        itemsWithKey
          .map((it) => resolveProductId(it))
          .filter((id): id is number => typeof id === "number"),
      ),
    ).filter((id) => !brandByProductId[id]);

    if (!ids.length) return;

    const fetchBrands = async () => {
      try {
        const resp: any = await getDiscountOptionProducts({
          ids: ids.join(","),
        });
        const list = resp?.data?.serve?.data ?? [];
        const next: Record<number, string> = {};
        for (const p of list) {
          const pid = Number(p?.id ?? 0);
          if (!pid) continue;
          const name = String(p?.brandName ?? p?.brand_name ?? "").trim();
          if (name) next[pid] = name;
        }
        if (Object.keys(next).length) {
          setBrandByProductId((prev) => ({ ...prev, ...next }));
        }
      } catch {
        // ignore: keep fallback label
      }
    };

    fetchBrands();
  }, [itemsWithKey, brandByProductId]);

  const brandGroups = React.useMemo(() => {
    const map = new Map<string, BrandGroupRow>();
    for (const it of itemsWithKey) {
      const brandName = resolveBrandName(it, brandByProductId);
      const key = `b-${brandName.toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(it);
        existing.totalVariants = existing.items.length;
        continue;
      }
      map.set(key, {
        key,
        brandName,
        totalVariants: 1,
        items: [it],
      });
    }
    return Array.from(map.values()).sort((a, b) =>
      a.brandName.localeCompare(b.brandName),
    );
  }, [itemsWithKey]);

  return (
    <div style={{ padding: "0 16px 16px" }}>
      <Table<BrandGroupRow>
        size="small"
        columns={[
          {
            title: "Brand",
            dataIndex: "brandName",
            key: "brandName",
            render: (v: string) => (
              <Text strong style={{ fontSize: 13 }}>
                {v}
              </Text>
            ),
          },
          {
            title: "Total Varian",
            dataIndex: "totalVariants",
            key: "totalVariants",
            align: "right",
            width: 140,
            render: (v: number) => (
              <Text style={{ fontSize: 13 }}>{Number(v ?? 0)}</Text>
            ),
          },
        ]}
        dataSource={brandGroups}
        pagination={false}
        rowKey="key"
        bordered
        style={{
          backgroundColor: token.colorFillAlter,
          borderRadius: 8,
        }}
        expandable={{
          defaultExpandAllRows: true,
          expandedRowRender: (group) => (
            <div style={{ marginLeft: -8, marginRight: -8 }}>
              <Table<DiscountVariantItem>
                size="small"
                columns={cols}
                dataSource={group.items}
                pagination={false}
                rowKey="__key"
                bordered
              />
            </div>
          ),
        }}
      />
    </div>
  );
};

export default DiscountVariantItemsTable;
