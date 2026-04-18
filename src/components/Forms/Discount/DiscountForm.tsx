import { useMemo, useState } from "react";
import {
  Form,
  Input,
  Button,
  Divider,
  InputNumber,
  Select,
  Space,
  Popconfirm,
  Typography,
  Switch,
  Tag,
  Tooltip,
  theme,
} from "antd";
import { useThemeStore } from "../../../hooks/useThemeStore";
import type { FormInstance } from "antd/es/form";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  InfoCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import helper from "../../../utils/helper";

import type {
  Props,
  VariantRow,
  ProductGroupRow,
  BrandGroupRow,
  DiscountFormPageViewModel,
} from "../../../hooks/discount/useDiscountFormPage";
import {
  rupiahFormatter,
  rupiahParser,
} from "../../../hooks/discount/useDiscountFormPage";
import DiscountFormHeader from "./DiscountFormHeader";
import DiscountFormActionsCard from "./DiscountFormActionsCard";
import DiscountPromoInfoCard from "./DiscountPromoInfoCard";
import DiscountBulkCard from "./DiscountBulkCard";
import DiscountProductPickerCard from "./DiscountProductPickerCard";
import DiscountSummaryBar from "./DiscountSummaryBar";
import DiscountVariantsTables from "./DiscountVariantsTables";

const { Text } = Typography;

export type DiscountFormProps = Props & {
  form: FormInstance;
  vm: DiscountFormPageViewModel;
};

function DiscountForm({ mode, form, vm }: DiscountFormProps) {
  const { token } = theme.useToken();
  const { isDarkMode } = useThemeStore();

  const {
    goToList,

    loading,
    ioLoading,
    importTransfer,
    setImportTransfer,
    ioScope,
    setIoScope,
    uploadProps,
    uploadRef,

    currentIdentifier,

    productOptions,
    productLoading,
    allProductsLoading,
    selectedProductId,
    setSelectedProductId,
    setSelectedProductName,
    selectedProductIds,
    setSelectedProductIds,
    variantOptions,
    variantLoading,
    selectedVariantIdsToAdd,
    setSelectedVariantIdsToAdd,

    inputMode,
    allPercent,
    allMaxDiscount,
    setInputMode,
    setAllPercent,
    setAllMaxDiscount,
    brandOptions,
    brandLoading,
    selectedBrandIds,
    setSelectedBrandIds,
    selectedBrandNameMap,
    setSelectedBrandNameMap,

    variants,
    filteredVariants,
    selectedVariantIds,
    setSelectedVariantIds,

    bulkPercent,
    bulkMaxDiscount,
    bulkPromoStock,
    setBulkPercent,
    setBulkMaxDiscount,
    setBulkPromoStock,

    productGroups,
    brandGroups,
    defaultExpandedRowKeys,
    defaultExpandedBrandKeys,

    exportItems,
    downloadTemplate,
    searchProducts,
    searchBrands,
    searchVariants,
    addProductsToVariants,
    addBrandsToVariants,
    removeBrandsFromVariants,
    addVariantsToVariants,
    addAllProductsToVariants,
    removeProduct,

    applyBulk,
    deleteSelectedVariants,

    computeFromPrice,
    computeFromPercent,
    updateVariant,

    onSubmit,
    setVariants,
    searchQuery,
    setSearchQuery,
    searchScope,
    setSearchScope,
  } = vm;

  const [selectedProductNameMap, setSelectedProductNameMap] = useState<
    Record<number, string>
  >({});

  const totalProducts = productGroups.length;
  const totalVariants = variants.length;
  const tableMode =
    searchScope === "brand"
      ? "brand"
      : searchScope === "variant"
        ? "variant"
        : "product";

  const productColumns: ColumnsType<ProductGroupRow> = useMemo(
    () => [
      {
        title: "",
        dataIndex: "image",
        key: "image",
        width: 60,
        render: (v: string) =>
          v ? (
            <img
              src={helper.renderImage(v)}
              alt="p"
              style={{
                width: 40,
                height: 40,
                objectFit: "cover",
                borderRadius: 4,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                background: isDarkMode ? token.colorFillSecondary : "#f5f5f5",
                borderRadius: 4,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            />
          ),
      },
      {
        title: "Produk",
        dataIndex: "productName",
        key: "productName",
        align: "left",
        onHeaderCell: () => ({
          style: { textAlign: "left" },
        }),
        render: (_: any, r) => (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, lineHeight: 1.2 }}>
                {r.productName}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {r.totalVariants} varian
              </div>
            </div>
          </div>
        ),
      },
      {
        title: "Harga Awal",
        dataIndex: "variants",
        key: "basePrice",
        width: 160,
        align: "right",
        render: (list: VariantRow[]) => {
          if (!list?.length) return "-";
          const prices = list.map((v) => v.basePrice);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          if (min === max)
            return <Text>{`Rp ${helper.formatRupiah(String(min))}`}</Text>;
          return (
            <Text>{`Rp ${helper.formatRupiah(String(min))} – ${helper.formatRupiah(
              String(max),
            )}`}</Text>
          );
        },
      },
      {
        title: "Diskon",
        dataIndex: "variants",
        key: "discount",
        width: 160,
        align: "center",
        render: (list: VariantRow[]) => {
          const withValue = list.filter(
            (v) =>
              typeof v.discountPercent === "number" ||
              typeof v.discountPrice === "number",
          );
          if (!withValue.length) return <Text type="secondary">-</Text>;
          const percentValues = withValue
            .map((v) => v.discountPercent)
            .filter((v): v is number => typeof v === "number");
          if (!percentValues.length) return <Text type="secondary">-</Text>;
          const min = Math.min(...percentValues);
          const max = Math.max(...percentValues);
          const label = min === max ? `${min}%` : `${min}% – ${max}%`;
          return <Tag color="blue">{label}</Tag>;
        },
      },
      {
        title: "Stok Promosi",
        dataIndex: "variants",
        key: "promoStock",
        width: 160,
        align: "right",
        render: (list: VariantRow[]) => {
          const values = list
            .map((v) => v.promoStock)
            .filter((v): v is number => typeof v === "number");
          if (!values.length) return <Text type="secondary">-</Text>;
          const min = Math.min(...values);
          const max = Math.max(...values);
          return min === max ? min : `${min} – ${max}`;
        },
      },
      {
        title: "",
        key: "actions",
        width: 140,
        align: "right",
        render: (_: any, r) => (
          <Popconfirm
            title="Hapus produk dari promo? (semua variannya ikut terhapus)"
            okText="Ya"
            cancelText="Batal"
            onConfirm={() => removeProduct(r.productId)}
          >
            <Button danger size="small">
              Hapus
            </Button>
          </Popconfirm>
        ),
      },
    ],
    [removeProduct],
  );

  const brandColumns: ColumnsType<BrandGroupRow> = useMemo(
    () => [
      {
        title: "Brand",
        dataIndex: "brandName",
        key: "brandName",
        render: (v: string) => <Text strong>{v}</Text>,
      },
      {
        title: "Total Produk",
        dataIndex: "totalProducts",
        key: "totalProducts",
        align: "right",
        width: 140,
      },
      {
        title: "Total Varian",
        dataIndex: "totalVariants",
        key: "totalVariants",
        align: "right",
        width: 140,
      },
      {
        title: "Aksi",
        key: "actions",
        align: "right",
        width: 120,
        render: (_: unknown, row) => {
          const brandId = Number(row.brandId ?? 0);
          if (brandId <= 0) return <Text type="secondary">-</Text>;
          return (
            <Popconfirm
              title={`Hapus semua produk brand ${row.brandName} dari promo?`}
              okText="Hapus"
              cancelText="Batal"
              onConfirm={() => removeBrandsFromVariants([brandId])}
            >
              <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                Hapus
              </Button>
            </Popconfirm>
          );
        },
      },
    ],
    [removeBrandsFromVariants],
  );

  const variantColumns: ColumnsType<VariantRow> = useMemo(
    () => [
      {
        title: "",
        dataIndex: "image",
        key: "image",
        width: 60,
        render: (v: string) =>
          v ? (
            <img
              src={helper.renderImage(v)}
              alt="v"
              style={{
                width: 40,
                height: 40,
                objectFit: "cover",
                borderRadius: 4,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                background: isDarkMode ? token.colorFillSecondary : "#f5f5f5",
                borderRadius: 4,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            />
          ),
      },
      {
        title: "Varian",
        dataIndex: "variantName",
        key: "variantName",
        render: (_: any, r) => (
          <div style={{ paddingLeft: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 2 }}>
              {r.productName}
            </div>
            <div style={{ fontWeight: 600 }}>{r.variantName}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              ID: {r.productVariantId}
            </div>
          </div>
        ),
      },
      {
        title: "Harga Awal",
        dataIndex: "basePrice",
        key: "basePrice",
        width: 140,
        align: "right",
        render: (v) => (
          <Text>{`Rp ${helper.formatRupiah(String(v ?? 0))}`}</Text>
        ),
      },
      {
        title: "Harga Diskon",
        dataIndex: "discountPrice",
        key: "discountPrice",
        width: 180,
        align: "right",
        render: (_: any, r) => (
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            max={r.basePrice}
            value={r.discountPrice ?? undefined}
            formatter={rupiahFormatter}
            parser={rupiahParser as any}
            onChange={(val) => {
              const n = Number(val ?? 0);
              const { p, pct } = computeFromPrice(r.basePrice, n);
              updateVariant(r.productVariantId, {
                discountPrice: p,
                discountPercent: pct,
                lastEdited: "price",
              });
            }}
            disabled={!r.isActive}
            placeholder="Rp"
          />
        ),
      },
      {
        title: (
          <Space size={6}>
            <span>Diskon %</span>
            <Tooltip title="Alternatif isi Harga Diskon atau Diskon %. Sistem akan menyesuaikan otomatis.">
              <InfoCircleOutlined style={{ opacity: 0.7 }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "discountPercent",
        key: "discountPercent",
        width: 160,
        align: "right",
        render: (_: any, r) => (
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            max={100}
            value={r.discountPercent ?? undefined}
            onChange={(val) => {
              const n = Number(val ?? 0);
              const { pct, discounted } = computeFromPercent(r.basePrice, n);
              updateVariant(r.productVariantId, {
                discountPercent: pct,
                discountPrice: discounted,
                lastEdited: "percent",
              });
            }}
            disabled={!r.isActive}
            placeholder="Contoh 10"
            addonAfter="%"
          />
        ),
      },
      {
        title: "Stok",
        dataIndex: "stock",
        key: "stock",
        width: 90,
        align: "right",
        render: (v) => <Text>{Number(v ?? 0)}</Text>,
      },
      {
        title: "Stok Promo",
        dataIndex: "promoStock",
        key: "promoStock",
        width: 180,
        align: "right",
        render: (_: any, r) => (
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Select
              size="small"
              value={r.promoStock === null ? "unlimited" : "limited"}
              onChange={(v: string) => {
                updateVariant(r.productVariantId, {
                  promoStock: v === "unlimited" ? null : 0,
                });
              }}
              options={[
                { value: "unlimited", label: "Tidak Terbatas" },
                { value: "limited", label: "Terbatas" },
              ]}
              style={{ width: "100%" }}
            />
            {r.promoStock !== null && (
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                value={r.promoStock}
                onChange={(val: number | null) => {
                  const n = Number(val ?? 0);
                  updateVariant(r.productVariantId, {
                    promoStock: Math.round(n),
                  });
                }}
                disabled={!r.isActive}
                placeholder="Jumlah"
              />
            )}
          </Space>
        ),
      },
      {
        title: "Batas Pembelian",
        dataIndex: "purchaseLimit",
        key: "purchaseLimit",
        width: 180,
        align: "right",
        render: (_: any, r) => (
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Select
              size="small"
              value={r.purchaseLimit === null ? "unlimited" : "limited"}
              onChange={(v: string) => {
                updateVariant(r.productVariantId, {
                  purchaseLimit: v === "unlimited" ? null : 0,
                });
              }}
              options={[
                { value: "unlimited", label: "Tidak Terbatas" },
                { value: "limited", label: "Terbatas" },
              ]}
              style={{ width: "100%" }}
            />
            {r.purchaseLimit !== null && (
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                value={r.purchaseLimit}
                onChange={(val: number | null) => {
                  const n = Number(val ?? 0);
                  updateVariant(r.productVariantId, {
                    purchaseLimit: Math.round(n),
                  });
                }}
                disabled={!r.isActive}
                placeholder="Jumlah"
              />
            )}
          </Space>
        ),
      },
      {
        title: "Aktif",
        dataIndex: "isActive",
        key: "isActive",
        width: 70,
        align: "center",
        render: (_: any, r) => (
          <Switch
            size="small"
            checked={r.isActive}
            onChange={(v: boolean) =>
              updateVariant(r.productVariantId, { isActive: Boolean(v) })
            }
          />
        ),
      },
      {
        title: "",
        key: "remove",
        width: 70,
        align: "right",
        render: (_: any, r) => (
          <Button
            type="link"
            danger
            size="small"
            onClick={() => {
              setVariants((prev: VariantRow[]) =>
                prev.filter((v: VariantRow) => v.productVariantId !== r.productVariantId),
              );
            }}
          >
            Hapus
          </Button>
        ),
      },
    ],
    [computeFromPrice, computeFromPercent, updateVariant],
  );

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ width: "100%", margin: 0 }}>
        <Form form={form} layout="vertical" scrollToFirstError>
          {/* Hidden fields */}
          <Form.Item name="is_active" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="is_ecommerce" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="is_pos" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="no_expiry" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="days_of_week" hidden>
            <Input />
          </Form.Item>

          <DiscountFormHeader mode={mode} />
          <DiscountFormActionsCard
            mode={mode}
            currentIdentifier={currentIdentifier}
            loading={loading || allProductsLoading}
            onSubmit={onSubmit}
            goToList={goToList}
          />
          <DiscountPromoInfoCard
            mode={mode}
            currentIdentifier={currentIdentifier}
            ioScope={ioScope}
            setIoScope={setIoScope}
            importTransfer={importTransfer}
            setImportTransfer={setImportTransfer}
            uploadProps={uploadProps}
            uploadRef={uploadRef}
            ioLoading={ioLoading}
            exportItems={exportItems}
            downloadTemplate={downloadTemplate}
          />

          <Divider style={{ margin: "12px 0" }} />

          <DiscountProductPickerCard
            inputMode={inputMode}
            setInputMode={setInputMode}
            productOptions={productOptions}
            productLoading={productLoading}
            variantOptions={variantOptions}
            variantLoading={variantLoading}
            allProductsLoading={allProductsLoading}
            setSelectedProductId={setSelectedProductId}
            setSelectedProductName={setSelectedProductName}
            selectedProductId={selectedProductId}
            selectedProductIds={selectedProductIds}
            setSelectedProductIds={setSelectedProductIds}
            selectedVariantIdsToAdd={selectedVariantIdsToAdd}
            setSelectedVariantIdsToAdd={setSelectedVariantIdsToAdd}
            selectedProductNameMap={selectedProductNameMap}
            setSelectedProductNameMap={setSelectedProductNameMap}
            brandOptions={brandOptions}
            brandLoading={brandLoading}
            selectedBrandIds={selectedBrandIds}
            setSelectedBrandIds={setSelectedBrandIds}
            selectedBrandNameMap={selectedBrandNameMap}
            setSelectedBrandNameMap={setSelectedBrandNameMap}
            searchProducts={searchProducts}
            searchBrands={searchBrands}
            searchVariants={searchVariants}
            addProductsToVariants={addProductsToVariants}
            addBrandsToVariants={addBrandsToVariants}
            removeBrandsFromVariants={removeBrandsFromVariants}
            addVariantsToVariants={addVariantsToVariants}
            addAllProductsToVariants={addAllProductsToVariants}
          />

          <DiscountBulkCard
            inputMode={inputMode}
            allPercent={allPercent}
            setAllPercent={setAllPercent}
            allMaxDiscount={allMaxDiscount}
            setAllMaxDiscount={setAllMaxDiscount}
            bulkPercent={bulkPercent}
            setBulkPercent={setBulkPercent}
            bulkMaxDiscount={bulkMaxDiscount}
            setBulkMaxDiscount={setBulkMaxDiscount}
            bulkPromoStock={bulkPromoStock}
            setBulkPromoStock={setBulkPromoStock}
            selectedVariantIds={selectedVariantIds}
            variants={variants}
            applyBulk={applyBulk}
            deleteSelectedVariants={deleteSelectedVariants}
            rupiahFormatter={rupiahFormatter}
            rupiahParser={rupiahParser}
            loading={allProductsLoading}
          />

          <>
            <div style={{ marginBottom: 16 }}>
              <Space wrap size="middle">
                <Select
                  value={searchScope}
                  onChange={(val) =>
                    setSearchScope(val as "all" | "brand" | "product" | "variant")
                  }
                  style={{ width: 160 }}
                  options={[
                    { label: "Semua", value: "all" },
                    { label: "Brand", value: "brand" },
                    { label: "Produk", value: "product" },
                    { label: "Varian", value: "variant" },
                  ]}
                />
                <Input
                  placeholder="Cari berurutan: Brand > Produk > Varian (juga bisa SKU/ID)"
                  prefix={
                    <SearchOutlined style={{ color: token.colorTextDescription }} />
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                  style={{ width: 360, maxWidth: "100%" }}
                />
              </Space>
            </div>

            <DiscountSummaryBar
              totalProducts={totalProducts}
              totalVariants={totalVariants}
              selectedCount={selectedVariantIds.length}
            />

            <DiscountVariantsTables
              inputMode={tableMode}
              brandGroups={brandGroups}
              productGroups={productGroups}
              variantRows={filteredVariants}
              brandColumns={brandColumns}
              productColumns={productColumns}
              variantColumns={variantColumns}
              defaultExpandedRowKeys={defaultExpandedRowKeys}
              defaultExpandedBrandKeys={defaultExpandedBrandKeys}
              selectedVariantIds={selectedVariantIds}
              setSelectedVariantIds={setSelectedVariantIds}
            />
          </>
        </Form>
      </div>
    </div>
  );
}

export default DiscountForm;


