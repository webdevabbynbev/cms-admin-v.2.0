import React from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Popconfirm,
  Switch,
  InputNumber,
  Upload,
  message,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ThunderboltOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { ProductGroupRow, VariantRow } from "./saleTypes";
import helper from "../../../utils/helper";
import {
  clamp,
  computeFromPercent,
  computeFromPrice,
  percentParser,
  rupiahFormatter,
  rupiahParser,
  toNumber,
} from "./saleUtils";

const { Text } = Typography;

type Summary = {
  totalProducts: number;
  totalVariants: number;
  activeVariants: number;
  totalQuota: number;
};

type Props = {
  inputMode: "product" | "brand" | "variant";
  setInputMode: (mode: "product" | "brand" | "variant") => void;
  productOptions: { label: string; value: number | string }[];
  productLoading: boolean;
  selectedProductId: number | null;
  setSelectedProductId: (id: number | null) => void;
  selectedProductName: string;
  setSelectedProductName: (name: string) => void;
  brandOptions: { label: string; value: number }[];
  brandProductOptions: { label: string; value: number | string }[];
  brandLoading: boolean;
  selectedBrandId: number | null;
  setSelectedBrandId: (id: number | null) => void;
  selectedBrandName: string;
  setSelectedBrandName: (name: string) => void;
  selectedProductIds: number[];
  setSelectedProductIds: (ids: number[]) => void;
  selectedProductNameMap: Record<number, string>;
  setSelectedProductNameMap: (map: Record<number, string>) => void;
  variantOptions: { label: string; value: number | string }[];
  variantLoading: boolean;
  selectedVariantIdsToAdd: number[];
  setSelectedVariantIdsToAdd: (ids: number[]) => void;
  variants: VariantRow[];
  productGroups: ProductGroupRow[];
  summary: Summary;
  searchProducts: (q: string) => void;
  searchBrands: (q: string) => void;
  loadMoreBrands: () => void;
  searchBrandProducts: (q: string, brandId?: number | null) => void;
  searchVariantsGlobal: (q: string) => void;
  addProductToVariants: (productId: number, productName: string) => void;
  addProductsToVariants: (
    productIds: number[],
    nameMap?: Record<number, string>,
  ) => void;
  addVariantIdsToSale: (variantIds: number[]) => void;
  removeProduct: (productId: number) => void;
  removeVariant: (variantId: number) => void;
  updateVariant: (variantId: number, payload: Partial<VariantRow>) => void;
};

type BulkRow = {
  productId: number;
  variantId?: number;
  salePrice?: number;
  salePercent?: number;
  saleStock?: number;
  isActive?: boolean;
  hasUpdates: boolean;
};

const ProductsVariantsCard: React.FC<Props> = ({
  inputMode,
  setInputMode,
  productOptions,
  productLoading,
  selectedProductId,
  setSelectedProductId,
  selectedProductName,
  setSelectedProductName,
  brandOptions,
  brandProductOptions,
  brandLoading,
  selectedBrandId,
  setSelectedBrandId,
  selectedBrandName,
  setSelectedBrandName,
  selectedProductIds,
  setSelectedProductIds,
  selectedProductNameMap,
  setSelectedProductNameMap,
  variantOptions,
  variantLoading,
  selectedVariantIdsToAdd,
  setSelectedVariantIdsToAdd,
  variants,
  productGroups,
  summary,
  searchProducts,
  searchBrands,
  loadMoreBrands,
  searchBrandProducts,
  searchVariantsGlobal,
  addProductToVariants,
  addProductsToVariants,
  addVariantIdsToSale,
  removeProduct,
  removeVariant,
  updateVariant,
}) => {
  const { token } = theme.useToken();

  const iconBaseStyle = {
    fontSize: 12,
  } as const;
  const flashIconStyle = {
    fontSize: 12,
    color: token.colorPrimary,
  } as const;
  const activeIconStyle = {
    fontSize: 12,
    color: token.colorPrimary,
  } as const;

  const [bulkUploading, setBulkUploading] = React.useState(false);
  const [pendingVariantUpdates, setPendingVariantUpdates] = React.useState<
    BulkRow[]
  >([]);
  const [recentAddedIds, setRecentAddedIds] = React.useState<number[]>([]);
  const bulkTemplate =
    "product_id,variant_id,sale_price,sale_percent,sale_stock,is_active\n" +
    "123,456,12000,,10,1\n" +
    "123,457,,20,5,1\n" +
    "789,,,,,1\n";

  const parseBulkRows = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return [];

    const firstLine = lines[0];
    const delimiter = firstLine.includes(";")
      ? ";"
      : firstLine.includes("\t")
        ? "\t"
        : ",";

    const parseLine = (line: string) =>
      line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));

    const normalizeHeader = (v: string) => v.toLowerCase().replace(/\s+/g, "");

    const headerCols = parseLine(lines[0]).map(normalizeHeader);
    const headerLooksValid = headerCols.some((h) =>
      [
        "product_id",
        "productid",
        "id",
        "variant_id",
        "variantid",
        "sale_price",
        "saleprice",
        "sale_percent",
        "sale_percent",
        "sale_stock",
        "salestock",
        "flash_price",
        "flashprice",
        "is_active",
        "active",
        "aktif",
      ].includes(h),
    );

    const header = headerLooksValid ? headerCols : [];

    const getHeaderIndex = (names: string[]) =>
      header.findIndex((h) => names.includes(h));

    const productIdIdx = getHeaderIndex(["product_id", "productid", "id"]);
    const variantIdIdx = getHeaderIndex(["variant_id", "variantid", "variant"]);
    const salePriceIdx = getHeaderIndex([
      "sale_price",
      "saleprice",
      "harga_sale",
      "flash_price",
      "flashprice",
      "harga_flash_sale",
      "harga_flash",
    ]);
    const salePercentIdx = getHeaderIndex([
      "sale_percent",
      "salepercent",
      "flash_percent",
      "flashpercent",
      "diskon",
      "discount",
      "percent",
      "persen",
    ]);
    const saleStockIdx = getHeaderIndex([
      "sale_stock",
      "salestock",
      "flash_stock",
      "flashstock",
      "quota",
      "kuota",
      "stok_sale",
      "stok_flash_sale",
    ]);
    const isActiveIdx = getHeaderIndex([
      "is_active",
      "active",
      "aktif",
      "isactive",
    ]);

    const parseIntMaybe = (value: string | undefined) => {
      const digits = String(value ?? "").replace(/[^\d]/g, "");
      if (!digits) return null;
      const n = Number(digits);
      return Number.isFinite(n) ? Math.trunc(n) : null;
    };

    const parseNumberMaybe = (value: string | undefined) => {
      const digits = String(value ?? "").replace(/[^\d]/g, "");
      if (!digits) return null;
      return toNumber(digits, 0);
    };

    const parseBooleanMaybe = (value: string | undefined) => {
      if (!value) return null;
      const normalized = value.toLowerCase().trim();
      if (["1", "true", "yes", "y", "on", "aktif"].includes(normalized))
        return true;
      if (["0", "false", "no", "n", "off", "nonaktif"].includes(normalized))
        return false;
      return null;
    };

    const startIdx = headerLooksValid ? 1 : 0;

    return lines
      .slice(startIdx)
      .map((line) => {
        const cols = parseLine(line);
        const productId =
          productIdIdx >= 0
            ? parseIntMaybe(cols[productIdIdx])
            : parseIntMaybe(cols[0]);
        const variantId =
          variantIdIdx >= 0 ? parseIntMaybe(cols[variantIdIdx]) : null;
        const salePrice =
          salePriceIdx >= 0 ? parseNumberMaybe(cols[salePriceIdx]) : null;
        const salePercent =
          salePercentIdx >= 0 ? parseNumberMaybe(cols[salePercentIdx]) : null;
        const saleStock =
          saleStockIdx >= 0 ? parseNumberMaybe(cols[saleStockIdx]) : null;
        const isActive =
          isActiveIdx >= 0 ? parseBooleanMaybe(cols[isActiveIdx]) : null;

        if (!productId) return null;

        const hasUpdates =
          salePrice !== null ||
          salePercent !== null ||
          saleStock !== null ||
          isActive !== null;

        return {
          productId,
          variantId: variantId ?? undefined,
          salePrice: salePrice ?? undefined,
          salePercent: salePercent ?? undefined,
          saleStock: saleStock ?? undefined,
          isActive: isActive ?? undefined,
          hasUpdates,
        } as BulkRow;
      })
      .filter(Boolean) as BulkRow[];
  };

  const handleBulkFile = async (file: File) => {
    if (bulkUploading) return false;
    setBulkUploading(true);
    try {
      const text = await file.text();
      const rows = parseBulkRows(text);
      if (!rows.length) {
        message.error("CSV kosong atau tidak menemukan kolom product_id");
        return false;
      }

      const ids = rows.map((r) => r.productId);
      const existing = new Set(productGroups.map((g) => Number(g.productId)));
      const uniqueIds = Array.from(new Set(ids)).filter(
        (id) => !existing.has(id),
      );

      const rowsWithUpdates = rows.filter((r) => r.hasUpdates);
      const missingVariant = rowsWithUpdates.filter((r) => !r.variantId);
      const pendingUpdates = rowsWithUpdates.filter((r) => r.variantId);

      if (missingVariant.length) {
        message.warning(
          "Baris dengan harga/diskon/kuota harus mengisi kolom variant_id. Data tanpa variant_id akan diabaikan.",
        );
      }

      if (!uniqueIds.length) {
        if (pendingUpdates.length) {
          setPendingVariantUpdates((prev) => [...prev, ...pendingUpdates]);
        } else {
          message.info("Semua produk sudah ada di daftar");
          return false;
        }
      }

      if (uniqueIds.length) {
        message.loading({
          key: "bulk-sale",
          content: `Menambahkan ${uniqueIds.length} produk...`,
        });

        addRecentIds(uniqueIds);
        for (const id of uniqueIds) {
          await addProductToVariants(id, "");
        }

        message.success({
          key: "bulk-sale",
          content: `Selesai menambahkan ${uniqueIds.length} produk`,
          duration: 2,
        });
      }

      if (pendingUpdates.length) {
        setPendingVariantUpdates((prev) => [...prev, ...pendingUpdates]);
      }
    } catch (e) {
      message.error("Gagal membaca file CSV");
    } finally {
      setBulkUploading(false);
    }
    return false;
  };

  React.useEffect(() => {
    if (!pendingVariantUpdates.length) return;

    const variantMap = new Map<number, VariantRow>();
    productGroups.forEach((group) => {
      group.variants.forEach((variant) => {
        variantMap.set(Number(variant.variantId), variant);
      });
    });

    const ready: BulkRow[] = [];
    const remaining: BulkRow[] = [];

    pendingVariantUpdates.forEach((row) => {
      if (row.variantId && variantMap.has(row.variantId)) {
        ready.push(row);
      } else {
        remaining.push(row);
      }
    });

    if (!ready.length) return;

    ready.forEach((row) => {
      const variant = variantMap.get(row.variantId as number);
      if (!variant) return;

      const basePrice = toNumber(variant.basePrice, 0);
      const baseStock = toNumber(variant.baseStock, 0);

      if (row.isActive === false) {
        updateVariant(row.variantId as number, {
          isActive: false,
          salePrice: basePrice,
          salePercent: 0,
          saleStock: 0,
        });
        return;
      }

      const payload: Partial<VariantRow> = {};

      if (row.isActive === true) {
        payload.isActive = true;
      }

      if (row.salePrice !== undefined) {
        const { p, pct } = computeFromPrice(basePrice, row.salePrice);
        payload.salePrice = p;
        payload.salePercent = pct;
      } else if (row.salePercent !== undefined) {
        const { pct, discounted } = computeFromPercent(
          basePrice,
          row.salePercent,
        );
        payload.salePercent = pct;
        payload.salePrice = discounted;
      }

      if (row.saleStock !== undefined) {
        payload.saleStock = clamp(Math.round(row.saleStock), 0, baseStock);
      }

      if (Object.keys(payload).length) {
        updateVariant(row.variantId as number, payload);
      }
    });

    setPendingVariantUpdates(remaining);
  }, [pendingVariantUpdates, productGroups, updateVariant]);

  const downloadBulkTemplate = () => {
    const blob = new Blob([bulkTemplate], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sale-products-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const addRecentIds = (ids: number[]) => {
    if (!ids.length) return;
    setRecentAddedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const removeProductAndSync = (productId: number) => {
    removeProduct(productId);
    setRecentAddedIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleRemoveRecent = () => {
    if (!recentAddedIds.length) return;
    recentAddedIds.forEach((id) => removeProduct(id));
    setRecentAddedIds([]);
    message.success("Produk yang baru ditambahkan sudah dihapus");
  };

  const productColumns: ColumnsType<ProductGroupRow> = [
    {
      title: "Nama Produk",
      dataIndex: "productName",
      key: "productName",
      render: (_: any, r) => (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 6,
              background: token.colorBgContainerDisabled,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {r.image ? (
              <img
                src={r.image}
                alt={r.productName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : null}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: token.colorText }}>{r.productName}</div>
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
            gap: 6,
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          <ThunderboltOutlined style={iconBaseStyle} /> Harga Awal
        </span>
      ),
      key: "base",
      width: 130,
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
            fontSize: 12,
            justifyContent: "center",
          }}
        >
          <AppstoreOutlined style={flashIconStyle} /> Harga Sale
        </span>
      ),
      key: "salePrice",
      width: 170,
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
            fontSize: 12,
            justifyContent: "center",
          }}
        >
          <AppstoreOutlined style={flashIconStyle} /> Diskon
        </span>
      ),
      key: "flashPct",
      width: 160,
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
            fontSize: 12,
            justifyContent: "center",
          }}
        >
          <ThunderboltOutlined style={iconBaseStyle} /> Stok Asli
        </span>
      ),
      key: "stock",
      width: 80,
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
            fontSize: 12,
            justifyContent: "center",
          }}
        >
          <AppstoreOutlined style={flashIconStyle} /> Kuota Sale
        </span>
      ),
      key: "saleStock",
      width: 140,
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
            fontSize: 12,
            justifyContent: "center",
          }}
        >
          <CheckCircleOutlined style={activeIconStyle} /> Aktif
        </span>
      ),
      key: "active",
      width: 80,
    },
    {
      title: "Aksi",
      key: "action",
      width: 90,
      align: "center",
      render: (_: any, r) => (
        <Popconfirm
          title="Hapus produk dari sale?"
          okText="Hapus"
          cancelText="Batal"
          onConfirm={() => removeProductAndSync(r.productId)}
        >
          <Button type="link" danger>
            Hapus
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const variantColumns: ColumnsType<VariantRow> = [
    {
      title:
        inputMode === "variant" ? (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            <ThunderboltOutlined style={iconBaseStyle} /> Nama Varian
          </span>
        ) : (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            <ThunderboltOutlined style={iconBaseStyle} /> Nama Produk
          </span>
        ),
      dataIndex: "label",
      key: "label",
      render: (_: any, r) =>
        inputMode === "variant" ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 6,
                background: token.colorBgContainerDisabled,
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {r.image ? (
                <img
                  src={r.image}
                  alt={r.label || r.sku || "Varian"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : null}
            </div>
            <div style={{ fontWeight: 500, color: token.colorText }}>
              {(() => {
                const sku = String(r.sku || "").trim();
                const vname = String(r.variantName || "").trim();
                if (sku && vname && vname !== sku && vname !== "Varian") {
                  return `${sku} - ${vname}`;
                }
                return sku || vname || "Varian";
              })()}
            </div>
          </div>
        ) : (
          <div style={{ paddingLeft: 44 }}>
            <div style={{ fontWeight: 500, color: token.colorText }}>
              {(() => {
                const sku = String(r.sku || "").trim();
                const vname = String(r.variantName || "").trim();
                if (sku && vname && vname !== sku && vname !== "Varian") {
                  return `${sku} - ${vname}`;
                }
                return sku || vname || "Varian";
              })()}
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
            gap: 6,
            fontWeight: 600,
            fontSize: 12,
            justifyContent: "flex-end",
          }}
        >
          <ThunderboltOutlined style={iconBaseStyle} /> Harga Awal
        </span>
      ),
      dataIndex: "basePrice",
      key: "basePrice",
      width: 130,
      align: "right",
      render: (v) => <Text style={{ color: token.colorText }}>{`Rp ${helper.formatRupiah(String(v ?? 0))}`}</Text>,
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
            fontSize: 12,
            justifyContent: "flex-end",
          }}
        >
          <AppstoreOutlined style={flashIconStyle} /> Harga Sale
        </span>
      ),
      dataIndex: "salePrice",
      key: "salePrice",
      width: 170,
      align: "right",
      render: (_: any, r) => (
        <InputNumber
          style={{ width: "100%" }}
          min={0}
          max={r.basePrice}
          value={r.salePrice}
          formatter={rupiahFormatter}
          parser={rupiahParser}
          onChange={(val) => {
            const n = clamp(toNumber(val, 0), 0, r.basePrice);
            const { pct } = computeFromPrice(r.basePrice, n);
            updateVariant(r.variantId, { salePrice: n, salePercent: pct });
          }}
          disabled={!r.isActive}
          placeholder="Rp"
        />
      ),
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          <span style={{ marginRight: 4 }}>
            <AppstoreOutlined style={flashIconStyle} /> Diskon
          </span>
          <Text type="secondary" style={{ fontSize: 11 }}>
            (Rp/%)
          </Text>
        </div>
      ),
      dataIndex: "salePercent",
      key: "salePercent",
      width: 160,
      align: "left",
      render: (_: any, r) => (
        <Space>
          <Text type="secondary">OR</Text>
          <InputNumber
            style={{ width: 80 }}
            min={0}
            max={100}
            value={r.salePercent}
            onChange={(val) => {
              const n = clamp(toNumber(val, 0), 0, 100);
              const { discounted } = computeFromPercent(r.basePrice, n);
              updateVariant(r.variantId, {
                salePercent: n,
                salePrice: discounted,
              });
            }}
            disabled={!r.isActive}
            formatter={(value) =>
              value === null || value === undefined ? "" : `${value}%`
            }
            parser={percentParser}
          />
        </Space>
      ),
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
            fontSize: 12,
            justifyContent: "flex-end",
          }}
        >
          <ThunderboltOutlined style={iconBaseStyle} /> Stok Asli
        </span>
      ),
      dataIndex: "baseStock",
      key: "baseStock",
      width: 80,
      align: "right",
      render: (v) => <Text style={{ color: token.colorText }}>{Number(v ?? 0)}</Text>,
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
            fontSize: 12,
            justifyContent: "center",
          }}
        >
          <AppstoreOutlined style={flashIconStyle} /> Kuota Sale
        </span>
      ),
      dataIndex: "saleStock",
      key: "saleStock",
      width: 140,
      align: "right",
      render: (_: any, r) => (
        <InputNumber
          style={{ width: "100%" }}
          min={0}
          max={r.baseStock}
          value={r.saleStock}
          onChange={(val) => {
            const n = clamp(toNumber(val, 0), 0, r.baseStock);
            updateVariant(r.variantId, { saleStock: n });
          }}
          disabled={!r.isActive}
        />
      ),
    },
    {
      title: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
            fontSize: 12,
            justifyContent: "center",
          }}
        >
          <CheckCircleOutlined style={activeIconStyle} /> Aktif
        </span>
      ),
      dataIndex: "isActive",
      key: "isActive",
      width: 80,
      align: "center",
      render: (_: any, r) => (
        <Switch
          size="small"
          checked={r.isActive}
          onChange={(checked) => {
            if (!checked) {
              updateVariant(r.variantId, {
                isActive: false,
                salePrice: r.basePrice,
                salePercent: 0,
                saleStock: 0,
              });
              return;
            }
            updateVariant(r.variantId, { isActive: true });
          }}
        />
      ),
    },
    {
      title: "Aksi",
      key: "action",
      width: 90,
      align: "center",
      render: (_: any, r) =>
        inputMode === "variant" ? (
          <Popconfirm
            title="Hapus varian dari sale?"
            okText="Hapus"
            cancelText="Batal"
            onConfirm={() => removeVariant(r.variantId)}
          >
            <Button type="link" danger>
              Hapus
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <Card
      size="small"
      title={
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            color: token.colorText,
          }}
        >
          <AppstoreOutlined style={flashIconStyle} /> Input Produk dan Varian
          Sale
        </span>
      }
      style={{
        marginBottom: 20,
        borderRadius: 12,
        backgroundColor: token.colorBgContainer,
      }}
    >
      <Alert
        type="info"
        showIcon
        message="Atur harga dan kuota"
        description="Harga sale bisa diisi nominal atau persentase (salah satu). Kuota 0 akan menonaktifkan varian."
        style={{ marginBottom: 12 }}
      />
      <Row gutter={12} align="middle" style={{ marginBottom: 8 }}>
        <Col xs={24} md={8}>
          <Select
            value={inputMode}
            size="large"
            onChange={(v) => setInputMode(v as "product" | "brand" | "variant")}
            options={[
              { value: "product", label: "Per Product" },
              { value: "brand", label: "Per Brand" },
              { value: "variant", label: "Per Variant" },
            ]}
            style={{ width: "100%" }}
          />
        </Col>
      </Row>

      {inputMode === "product" ? (
        <Row gutter={[12, 12]} style={{ marginBottom: 8 }}>
          <Col xs={24}>
            <Select
              showSearch
              filterOption={false}
              onSearch={searchProducts}
              onFocus={() => searchProducts("")}
              options={productOptions}
              loading={productLoading}
              placeholder="Cari produk untuk ditambahkan..."
              value={selectedProductId ?? undefined}
              onChange={(v, opt: any) => {
                setSelectedProductId(Number(v));
                setSelectedProductName(opt?.label || "");
              }}
              size="large"
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24}>
            <Button
              block
              type="primary"
              disabled={!selectedProductId}
              onClick={() => {
                if (selectedProductId) {
                  addRecentIds([selectedProductId]);
                  addProductToVariants(selectedProductId, selectedProductName);
                }
              }}
              style={{
                height: 40,
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              + Tambah Produk
            </Button>
          </Col>
        </Row>
      ) : inputMode === "brand" ? (
        <Row gutter={[12, 12]} style={{ marginBottom: 8 }}>
          <Col xs={24}>
            <Select
              showSearch
              filterOption={false}
              size="large"
              onSearch={searchBrands}
              onFocus={() => searchBrands("")}
              onOpenChange={(open) => open && searchBrands("")}
              onPopupScroll={(e) => {
                const target = e.target as HTMLDivElement;
                if (!target) return;
                const threshold = 40;
                const reachedBottom =
                  target.scrollTop + target.clientHeight >=
                  target.scrollHeight - threshold;
                if (reachedBottom) loadMoreBrands();
              }}
              options={brandOptions}
              loading={brandLoading}
              placeholder="Pilih brand..."
              value={selectedBrandId ?? undefined}
              onChange={(v, option: any) => {
                const id = Number(v);
                setSelectedBrandId(id);
                setSelectedBrandName(String(option?.label ?? ""));
                setSelectedProductIds([]);
                setSelectedProductNameMap({});
                searchBrandProducts("", id);
              }}
              style={{ width: "100%" }}
            />
            {selectedBrandName ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Terpilih: <b>{selectedBrandName}</b>
              </Text>
            ) : null}
          </Col>
          <Col xs={24}>
            <Select
              mode="multiple"
              showSearch
              filterOption={false}
              size="large"
              onSearch={(kw) => searchBrandProducts(kw, selectedBrandId)}
              onFocus={() =>
                selectedBrandId && searchBrandProducts("", selectedBrandId)
              }
              onOpenChange={(open) =>
                open &&
                selectedBrandId &&
                searchBrandProducts("", selectedBrandId)
              }
              options={brandProductOptions}
              loading={productLoading}
              placeholder={
                selectedBrandId
                  ? "Cari produk dari brand..."
                  : "Pilih brand terlebih dulu"
              }
              disabled={!selectedBrandId}
              value={selectedProductIds}
              onChange={(vals, options: any) => {
                const ids = (vals ?? []).map((v: any) => Number(v));
                setSelectedProductIds(ids);
                const map: Record<number, string> = {};
                (options ?? []).forEach((opt: any) => {
                  const id = Number(opt?.value);
                  if (!id) return;
                  map[id] = String(opt?.label ?? `Produk ${id}`);
                });
                setSelectedProductNameMap(map);
              }}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24}>
            <Button
              block
              type="primary"
              disabled={!selectedProductIds.length}
              onClick={() => {
                if (!selectedProductIds.length) return;
                addRecentIds(selectedProductIds);
                addProductsToVariants(
                  selectedProductIds,
                  selectedProductNameMap,
                );
                setSelectedProductIds([]);
                setSelectedProductNameMap({});
              }}
              style={{
                height: 40,
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              + Tambah Produk
            </Button>
          </Col>
        </Row>
      ) : (
        <Row gutter={[12, 12]} style={{ marginBottom: 8 }}>
          <Col xs={24}>
            <Select
              mode="multiple"
              showSearch
              filterOption={false}
              onSearch={searchVariantsGlobal}
              onFocus={() => searchVariantsGlobal("")}
              onOpenChange={(open) => open && searchVariantsGlobal("")}
              options={variantOptions}
              loading={variantLoading}
              placeholder="Cari varian..."
              value={selectedVariantIdsToAdd}
              onChange={(vals) => {
                const ids = (vals ?? []).map((v: any) => Number(v));
                setSelectedVariantIdsToAdd(ids);
              }}
              size="large"
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24}>
            <Button
              block
              type="primary"
              disabled={!selectedVariantIdsToAdd.length}
              onClick={() => {
                if (!selectedVariantIdsToAdd.length) return;
                addVariantIdsToSale(selectedVariantIdsToAdd);
                setSelectedVariantIdsToAdd([]);
              }}
              style={{
                height: 40,
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              + Tambah Varian
            </Button>
          </Col>
        </Row>
      )}
      <Row gutter={12} align="middle" style={{ marginBottom: 8 }}>
        <Col xs={24}>
          <Space wrap>
            <Upload
              accept=".csv"
              showUploadList={false}
              beforeUpload={(file) => handleBulkFile(file)}
              disabled={bulkUploading}
            >
              <Button disabled={bulkUploading}>
                {bulkUploading ? "Mengimpor..." : "Upload CSV (Bulk Produk)"}
              </Button>
            </Upload>
            <Button onClick={downloadBulkTemplate}>
              Download Template CSV
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Format: kolom `product_id` (wajib). Untuk set harga/diskon/kuota,
              isi `variant_id`.
            </Text>
          </Space>
        </Col>
      </Row>
      <Text
        type="secondary"
        style={{
          display: "block",
          marginBottom: 12,
        }}
      >
        Menambahkan produk akan memasukkan semua variannya. Nonaktifkan varian
        tertentu pada tabel.
      </Text>
      <Space wrap style={{ marginBottom: 12 }}>
        <Tag color="blue" style={{ borderRadius: 999, padding: "2px 10px" }}>
          Produk: {summary.totalProducts}
        </Tag>
        <Tag
          color="geekblue"
          style={{ borderRadius: 999, padding: "2px 10px" }}
        >
          Varian: {summary.totalVariants}
        </Tag>
        <Tag color="green" style={{ borderRadius: 999, padding: "2px 10px" }}>
          Aktif: {summary.activeVariants}
        </Tag>
        <Tag color="gold" style={{ borderRadius: 999, padding: "2px 10px" }}>
          Kuota: {summary.totalQuota}
        </Tag>
        <Popconfirm
          title="Hapus semua produk yang baru ditambahkan?"
          okText="Hapus"
          cancelText="Batal"
          onConfirm={handleRemoveRecent}
          disabled={!recentAddedIds.length}
        >
          <Button size="small" disabled={!recentAddedIds.length}>
            Hapus Produk Baru
          </Button>
        </Popconfirm>
      </Space>
      <Divider style={{ margin: "12px 0" }} />
      {inputMode === "variant" ? (
        <Table<VariantRow>
          rowKey="variantId"
          dataSource={variants}
          columns={variantColumns}
          size="middle"
          pagination={false}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: "Belum ada varian. Silakan pilih varian di atas.",
          }}
        />
      ) : (
        <Table<ProductGroupRow>
          rowKey="key"
          dataSource={productGroups}
          columns={productColumns}
          size="middle"
          pagination={false}
          scroll={{ x: 1000 }}
          expandable={{
            defaultExpandAllRows: false,
            expandedRowRender: (group) => (
              <div style={{ marginLeft: -8, marginRight: -8 }}>
                <Table<VariantRow>
                  rowKey="variantId"
                  dataSource={group.variants}
                  columns={variantColumns}
                  size="small"
                  pagination={false}
                  showHeader={false}
                />
              </div>
            ),
          }}
          locale={{
            emptyText:
              "Belum ada produk. Silakan cari dan tambahkan produk di atas.",
          }}
        />
      )}
    </Card>
  );
};

export default ProductsVariantsCard;
