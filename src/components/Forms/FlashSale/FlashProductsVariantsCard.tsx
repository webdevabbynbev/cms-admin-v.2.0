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
  Spin,
  Table,
  Tag,
  Typography,
  Popconfirm,
  Switch,
  InputNumber,
  Upload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ThunderboltOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ProductGroupRow, VariantRow } from "./flashTypes";
import helper from "../../../utils/helper";
import {
  clamp,
  computeFromPercent,
  computeFromPrice,
  percentParser,
  rupiahFormatter,
  rupiahParser,
  toNumber,
} from "./flashUtils";

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
  brandLoading: boolean;
  selectedBrandIds: number[];
  setSelectedBrandIds: (ids: number[]) => void;
  selectedBrandNameMap: Record<number, string>;
  setSelectedBrandNameMap: (map: Record<number, string>) => void;
  variantOptions: { label: string; value: number | string }[];
  variantLoading: boolean;
  selectedVariantIdsToAdd: number[];
  setSelectedVariantIdsToAdd: (ids: number[]) => void;
  selectedVariantIds: number[];
  setSelectedVariantIds: React.Dispatch<React.SetStateAction<number[]>>;
  bulkPercent: number | null;
  setBulkPercent: (value: number | null) => void;
  bulkPrice: number | null;
  setBulkPrice: (value: number | null) => void;
  bulkStock: number | null;
  setBulkStock: (value: number | null) => void;
  applyBulk: (scope: "selected" | "all") => void;
  deleteSelectedVariants: () => void;
  variants: VariantRow[];
  productGroups: ProductGroupRow[];
  summary: Summary;
  searchProducts: (q: string) => void;
  searchBrands: (q: string) => void;
  loadMoreBrands: () => void;
  searchVariantsGlobal: (q: string) => void;
  addProductToVariants: (productId: number, productName: string) => void;
  addBrandsToVariants: (
    brandIds: number[],
    brandNameMap?: Record<number, string>,
  ) => void;
  removeBrandsFromVariants: (
    brandIds: number[],
    options?: { silent?: boolean },
  ) => Promise<void>;
  addVariantIdsToFlashSale: (variantIds: number[]) => void;
  removeProduct: (productId: number) => void;
  removeVariant: (variantId: number) => void;
  updateVariant: (variantId: number, payload: Partial<VariantRow>) => void;
};

type BulkRow = {
  productId: number;
  variantId?: number;
  flashPrice?: number;
  flashPercent?: number;
  flashStock?: number;
  isActive?: boolean;
  hasUpdates: boolean;
};

const FlashProductsVariantsCard: React.FC<Props> = ({
  inputMode,
  setInputMode,
  productOptions,
  productLoading,
  selectedProductId,
  setSelectedProductId,
  selectedProductName,
  setSelectedProductName,
  brandOptions,
  brandLoading,
  selectedBrandIds,
  setSelectedBrandIds,
  selectedBrandNameMap,
  setSelectedBrandNameMap,
  variantOptions,
  variantLoading,
  selectedVariantIdsToAdd,
  setSelectedVariantIdsToAdd,
  selectedVariantIds,
  setSelectedVariantIds,
  bulkPercent,
  setBulkPercent,
  bulkPrice,
  setBulkPrice,
  bulkStock,
  setBulkStock,
  applyBulk,
  deleteSelectedVariants,
  variants,
  productGroups,
  summary,
  searchProducts,
  searchBrands,
  loadMoreBrands,
  searchVariantsGlobal,
  addProductToVariants,
  addBrandsToVariants,
  removeBrandsFromVariants,
  addVariantIdsToFlashSale,
  removeProduct,
  removeVariant,
  updateVariant,
}) => {
  const iconBaseStyle = {
    fontSize: 12,
  } as const;
  const flashIconStyle = {
    fontSize: 12,
    color: "var(--ant-primary-color)",
  } as const;
  const activeIconStyle = {
    fontSize: 12,
    color: "var(--ant-primary-color)",
  } as const;
  const [bulkUploading, setBulkUploading] = React.useState(false);
  const [pendingVariantUpdates, setPendingVariantUpdates] = React.useState<
    BulkRow[]
  >([]);
  const [recentAddedIds, setRecentAddedIds] = React.useState<number[]>([]);
  const productSearchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const variantSearchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const bulkTemplate =
    "product_id,variant_id,flash_price,flash_percent,flash_stock,is_active\n" +
    "123,456,12000,,10,1\n" +
    "123,457,,20,5,1\n" +
    "789,,,,,1\n";

  React.useEffect(
    () => () => {
      if (productSearchDebounceRef.current) {
        clearTimeout(productSearchDebounceRef.current);
      }
      if (variantSearchDebounceRef.current) {
        clearTimeout(variantSearchDebounceRef.current);
      }
    },
    [],
  );

  const runDebouncedSearch = (
    ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    callback: () => void,
  ) => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(callback, 280);
  };

  const loadingDropdown = (
    <Space size={8} style={{ padding: "8px 0" }}>
      <Spin size="small" />
      <Text type="secondary" style={{ fontSize: 12 }}>
        Memuat data...
      </Text>
    </Space>
  );
  const tablePagination = React.useMemo(
    () => ({
      pageSize: 20,
      showSizeChanger: true,
      showQuickJumper: true,
      pageSizeOptions: [10, 20, 50, 100],
    }),
    [],
  );
  const nestedVariantPagination = React.useMemo(
    () => ({
      pageSize: 10,
      showSizeChanger: true,
      pageSizeOptions: [5, 10, 20, 50],
      size: "small" as const,
    }),
    [],
  );
  const mergeUniqueIds = React.useCallback((ids: number[]) => {
    return Array.from(new Set(ids.map((id) => Number(id)).filter((id) => id > 0)));
  }, []);

  const updateSelectedByChangeRows = React.useCallback(
    (changeRows: VariantRow[], checked: boolean) => {
      const changedIds = changeRows
        .map((row) => Number(row.variantId))
        .filter((id) => id > 0);
      if (!changedIds.length) return;

      setSelectedVariantIds((prev) => {
        const prevIds = prev.map((id) => Number(id)).filter((id) => id > 0);
        if (checked) {
          return mergeUniqueIds([...prevIds, ...changedIds]);
        }
        const removeSet = new Set(changedIds);
        return prevIds.filter((id) => !removeSet.has(id));
      });
    },
    [mergeUniqueIds, setSelectedVariantIds],
  );

  const variantTableRowSelection = React.useMemo(
    () => ({
      selectedRowKeys: selectedVariantIds,
      onChange: (keys: React.Key[]) =>
        setSelectedVariantIds(
          keys.map((k) => Number(k)).filter((id) => Number.isFinite(id) && id > 0),
        ),
    }),
    [selectedVariantIds, setSelectedVariantIds],
  );

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
        "flash_price",
        "flashprice",
        "flash_percent",
        "flashpercent",
        "flash_stock",
        "flashstock",
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
    const flashPriceIdx = getHeaderIndex([
      "flash_price",
      "flashprice",
      "harga_flash_sale",
      "harga_flash",
      "harga_flashsale",
    ]);
    const flashPercentIdx = getHeaderIndex([
      "flash_percent",
      "flashpercent",
      "diskon",
      "discount",
      "percent",
      "persen",
    ]);
    const flashStockIdx = getHeaderIndex([
      "flash_stock",
      "flashstock",
      "quota",
      "kuota",
      "kuota_flash_sale",
      "stok_flash",
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
        const flashPrice =
          flashPriceIdx >= 0 ? parseNumberMaybe(cols[flashPriceIdx]) : null;
        const flashPercent =
          flashPercentIdx >= 0 ? parseNumberMaybe(cols[flashPercentIdx]) : null;
        const flashStock =
          flashStockIdx >= 0 ? parseNumberMaybe(cols[flashStockIdx]) : null;
        const isActive =
          isActiveIdx >= 0 ? parseBooleanMaybe(cols[isActiveIdx]) : null;

        if (!productId) return null;

        const hasUpdates =
          flashPrice !== null ||
          flashPercent !== null ||
          flashStock !== null ||
          isActive !== null;

        return {
          productId,
          variantId: variantId ?? undefined,
          flashPrice: flashPrice ?? undefined,
          flashPercent: flashPercent ?? undefined,
          flashStock: flashStock ?? undefined,
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
          key: "bulk-flashsale",
          content: `Menambahkan ${uniqueIds.length} produk...`,
        });

        addRecentIds(uniqueIds);
        for (const id of uniqueIds) {
          // nama produk akan diambil dari API detail produk
          // gunakan string kosong agar fallback ke name dari response

          await addProductToVariants(id, "");
        }

        message.success({
          key: "bulk-flashsale",
          content: `Selesai menambahkan ${uniqueIds.length} produk`,
          duration: 2,
        });
      }

      if (pendingUpdates.length) {
        setPendingVariantUpdates((prev) => [...prev, ...pendingUpdates]);
      }
    } catch {
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
          flashPrice: basePrice,
          flashPercent: 0,
          flashStock: 0,
        });
        return;
      }

      const payload: Partial<VariantRow> = {};

      if (row.isActive === true) {
        payload.isActive = true;
      }

      if (row.flashPrice !== undefined) {
        const { p, pct } = computeFromPrice(basePrice, row.flashPrice);
        payload.flashPrice = p;
        payload.flashPercent = pct;
      } else if (row.flashPercent !== undefined) {
        const { pct, discounted } = computeFromPercent(
          basePrice,
          row.flashPercent,
        );
        payload.flashPercent = pct;
        payload.flashPrice = discounted;
      }

      if (row.flashStock !== undefined) {
        payload.flashStock = clamp(Math.round(row.flashStock), 0, baseStock);
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
    anchor.download = "flash-sale-products-template.csv";
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
              background: "var(--ab-body-bg, #f0f2f5)",
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
            <div style={{ fontWeight: 600 }}>{r.productName}</div>
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
          <AppstoreOutlined style={flashIconStyle} /> Harga Flash Sale
        </span>
      ),
      key: "flashPrice",
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
          <AppstoreOutlined style={flashIconStyle} /> Kuota Flash Sale
        </span>
      ),
      key: "flashStock",
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
          title="Hapus produk dari flash sale?"
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
                background: "var(--ab-body-bg, #f0f2f5)",
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
            <div style={{ fontWeight: 500 }}>
              {r.label || r.sku || "Varian"}
            </div>
          </div>
        ) : (
          <div style={{ paddingLeft: 44 }}>
            <div style={{ fontWeight: 500 }}>
              {r.label || r.sku || "Varian"}
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
      render: (v) => <Text>{`Rp ${helper.formatRupiah(String(v ?? 0))}`}</Text>,
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
          <AppstoreOutlined style={flashIconStyle} /> Harga Flash Sale
        </span>
      ),
      dataIndex: "flashPrice",
      key: "flashPrice",
      width: 170,
      align: "right",
      render: (_: any, r) => (
        <InputNumber
          style={{ width: "100%" }}
          min={0}
          max={r.basePrice}
          value={r.flashPrice}
          formatter={rupiahFormatter}
          parser={rupiahParser}
          onChange={(val) => {
            const n = clamp(toNumber(val, 0), 0, r.basePrice);
            const { pct } = computeFromPrice(r.basePrice, n);
            updateVariant(r.variantId, { flashPrice: n, flashPercent: pct });
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
      dataIndex: "flashPercent",
      key: "flashPercent",
      width: 160,
      align: "left",
      render: (_: any, r) => (
        <Space>
          <Text type="secondary">OR</Text>
          <InputNumber
            style={{ width: 80 }}
            min={0}
            max={100}
            value={r.flashPercent}
            onChange={(val) => {
              const n = clamp(toNumber(val, 0), 0, 100);
              const { discounted } = computeFromPercent(r.basePrice, n);
              updateVariant(r.variantId, {
                flashPercent: n,
                flashPrice: discounted,
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
      render: (v) => <Text>{Number(v ?? 0)}</Text>,
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
          <AppstoreOutlined style={flashIconStyle} /> Kuota Flash Sale
        </span>
      ),
      dataIndex: "flashStock",
      key: "flashStock",
      width: 140,
      align: "right",
      render: (_: any, r) => (
        <InputNumber
          style={{ width: "100%" }}
          min={0}
          max={r.baseStock}
          value={r.flashStock}
          onChange={(val) => { const n = val === null || val === undefined ? r.baseStock : clamp(toNumber(val, 0), 0, r.baseStock); updateVariant(r.variantId, { flashStock: n }); }}
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
                flashPrice: r.basePrice,
                flashPercent: 0,
                flashStock: 0,
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
            title="Hapus varian dari flash sale?"
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
          }}
        >
          <AppstoreOutlined style={flashIconStyle} /> Input Produk dan Varian
          Flash Sale
        </span>
      }
      style={{
        marginBottom: 20,
        borderRadius: 12,
      }}
    >
      <Alert
        type="info"
        showIcon
        message="Atur harga dan kuota"
        description="Harga flash sale bisa diisi nominal atau persentase (salah satu). Kuota 0 akan menonaktifkan varian."
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
              onSearch={(kw) =>
                runDebouncedSearch(productSearchDebounceRef, () =>
                  searchProducts(kw),
                )
              }
              onFocus={() => {
                if (productSearchDebounceRef.current) {
                  clearTimeout(productSearchDebounceRef.current);
                }
                searchProducts("");
              }}
              onOpenChange={(open) => {
                if (!open) return;
                if (productSearchDebounceRef.current) {
                  clearTimeout(productSearchDebounceRef.current);
                }
                searchProducts("");
              }}
              options={productOptions}
              loading={productLoading}
              notFoundContent={productLoading ? loadingDropdown : "Tidak ada data"}
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
              mode="multiple"
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
              value={selectedBrandIds}
              allowClear
              maxTagCount="responsive"
              onChange={(vals, options: any) => {
                const ids = (vals ?? [])
                  .map((v: any) => Number(v))
                  .filter((id: number) => id > 0);
                const removedIds = selectedBrandIds.filter(
                  (id) => !ids.includes(id),
                );
                const nextMap: Record<number, string> = {};
                ids.forEach((id) => {
                  nextMap[id] = selectedBrandNameMap[id] ?? `Brand #${id}`;
                });
                (options ?? []).forEach((opt: any) => {
                  const id = Number(opt?.value ?? 0);
                  if (!id) return;
                  nextMap[id] = String(opt?.label ?? nextMap[id] ?? `Brand #${id}`);
                });
                setSelectedBrandIds(ids);
                setSelectedBrandNameMap(nextMap);
                if (removedIds.length) {
                  void removeBrandsFromVariants(removedIds, { silent: true });
                }
              }}
              onClear={() => {
                const removedIds = [...selectedBrandIds];
                setSelectedBrandIds([]);
                setSelectedBrandNameMap({});
                if (removedIds.length) {
                  void removeBrandsFromVariants(removedIds, { silent: true });
                }
              }}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24}>
            <Button
              block
              style={{ height: 40, fontWeight: 600 }}
              type="primary"
              disabled={!selectedBrandIds.length}
              loading={productLoading}
              onClick={() => {
                if (!selectedBrandIds.length) return;
                addBrandsToVariants(selectedBrandIds, selectedBrandNameMap);
              }}
            >
              + Tambah Brand
            </Button>
            <div style={{ marginTop: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Bisa pilih beberapa brand. Klik `x` pada tag untuk batal sebelum ditambahkan.
              </Text>
            </div>
          </Col>
        </Row>
      ) : (
        <Row gutter={[12, 12]} style={{ marginBottom: 8 }}>
          <Col xs={24}>
            <Select
              mode="multiple"
              showSearch
              filterOption={false}
              onSearch={(kw) =>
                runDebouncedSearch(variantSearchDebounceRef, () =>
                  searchVariantsGlobal(kw),
                )
              }
              onFocus={() => {
                if (variantSearchDebounceRef.current) {
                  clearTimeout(variantSearchDebounceRef.current);
                }
                searchVariantsGlobal("");
              }}
              onOpenChange={(open) => {
                if (!open) return;
                if (variantSearchDebounceRef.current) {
                  clearTimeout(variantSearchDebounceRef.current);
                }
                searchVariantsGlobal("");
              }}
              options={variantOptions}
              loading={variantLoading}
              notFoundContent={variantLoading ? loadingDropdown : "Tidak ada data"}
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
                addVariantIdsToFlashSale(selectedVariantIdsToAdd);
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
      <Card
        size="small"
        variant="outlined"
        style={{ marginBottom: 12 }}
        title={<span style={{ fontWeight: 600, fontSize: 14 }}>Perubahan Massal</span>}
        extra={
          <Text type="secondary" style={{ fontSize: 13 }}>
            Terpilih: <b>{selectedVariantIds.length}</b> varian
          </Text>
        }
      >
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
              Diskon (%)
            </div>
            <InputNumber
              style={{ width: "100%" }}
              size="large"
              min={0}
              max={100}
              value={bulkPercent ?? undefined}
              onChange={(v) =>
                setBulkPercent(v === null || v === undefined ? null : Number(v))
              }
              placeholder="Contoh: 10"
              addonAfter="%"
            />
          </Col>
          <Col xs={24} md={12}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
              Stok Promo
            </div>
            <InputNumber
              style={{ width: "100%" }}
              size="large"
              min={0}
              value={bulkStock ?? undefined}
              onChange={(v) =>
                setBulkStock(v === null || v === undefined ? null : Number(v))
              }
              placeholder="Tidak terbatas"
            />
          </Col>
        </Row>
        <Divider style={{ margin: "16px 0" }} />
        <Space wrap size="middle">
          <Button
            disabled={!variants.length}
            onClick={() => applyBulk("all")}
            size="large"
          >
            Terapkan ke Semua
          </Button>
          <Button
            type="primary"
            disabled={!selectedVariantIds.length}
            onClick={() => applyBulk("selected")}
            size="large"
          >
            Terapkan ke Terpilih ({selectedVariantIds.length})
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={!selectedVariantIds.length}
            onClick={deleteSelectedVariants}
            size="large"
          >
            Hapus Terpilih
          </Button>
        </Space>
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Gunakan perubahan massal untuk mempercepat pengaturan flash sale.
          </Text>
        </div>
      </Card>
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
          loading={productLoading}
          virtual
          rowSelection={variantTableRowSelection}
          pagination={tablePagination}
          scroll={{ x: 1000, y: 560 }}
          tableLayout="fixed"
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
          loading={productLoading}
          virtual
          pagination={tablePagination}
          scroll={{ x: 1000, y: 560 }}
          tableLayout="fixed"
          expandable={{
            defaultExpandAllRows: false,
            expandedRowRender: (group) => (
              <div style={{ marginLeft: -8, marginRight: -8 }}>
                <Table<VariantRow>
                  rowKey="variantId"
                  dataSource={group.variants}
                  columns={variantColumns}
                  size="small"
                  rowSelection={{
                    selectedRowKeys: selectedVariantIds.filter((id) =>
                      group.variants.some((row) => Number(row.variantId) === Number(id)),
                    ),
                    onSelect: (record, selected) =>
                      updateSelectedByChangeRows([record as VariantRow], selected),
                    onSelectAll: (selected, _selectedRows, changeRows) =>
                      updateSelectedByChangeRows(changeRows as VariantRow[], selected),
                  }}
                  pagination={nestedVariantPagination}
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

export default FlashProductsVariantsCard;
