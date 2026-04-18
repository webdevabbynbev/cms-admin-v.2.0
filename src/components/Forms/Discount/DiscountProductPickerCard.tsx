import { useEffect, useRef } from "react";
import type React from "react";
import { Button, Card, Col, Row, Select, Space, Spin, Tooltip, Typography, theme } from "antd";
import { InfoCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useThemeStore } from "../../../hooks/useThemeStore";

const { Text } = Typography;

type Option = { label: string; value: number | string };

type Props = {
  inputMode: "product" | "brand" | "all" | "variant";
  setInputMode: (mode: "product" | "brand" | "all" | "variant") => void;
  productOptions: Option[];
  productLoading: boolean;
  variantOptions: { label: string; value: number; productId?: number }[];
  variantLoading: boolean;
  allProductsLoading: boolean;
  setSelectedProductId: (id: number | null) => void;
  setSelectedProductName: (name: string) => void;
  selectedProductId: number | null;
  selectedProductIds: number[];
  setSelectedProductIds: (ids: number[]) => void;
  selectedVariantIdsToAdd: number[];
  setSelectedVariantIdsToAdd: (ids: number[]) => void;
  selectedProductNameMap: Record<number, string>;
  setSelectedProductNameMap: (map: Record<number, string>) => void;
  brandOptions: { label: string; value: number }[];
  brandLoading: boolean;
  selectedBrandIds: number[];
  setSelectedBrandIds: (ids: number[]) => void;
  selectedBrandNameMap: Record<number, string>;
  setSelectedBrandNameMap: (map: Record<number, string>) => void;
  searchProducts: (keyword: string, brandId?: number | null) => void;
  searchBrands: (keyword: string) => void;
  searchVariants: (keyword: string, productId?: number | null) => void;
  addProductsToVariants: (
    productIds: number[],
    nameMap?: Record<number, string>,
  ) => void;
  addBrandsToVariants: (
    brandIds: number[],
    brandNameMap?: Record<number, string>,
  ) => Promise<void>;
  removeBrandsFromVariants: (
    brandIds: number[],
    options?: { silent?: boolean },
  ) => Promise<void>;
  addVariantsToVariants: (variantIds: number[]) => void;
  addAllProductsToVariants: () => void;
};

const DiscountProductPickerCard: React.FC<Props> = ({
  inputMode,
  setInputMode,
  productOptions,
  productLoading,
  variantOptions,
  variantLoading,
  allProductsLoading,
  setSelectedProductId,
  setSelectedProductName,
  selectedProductIds,
  setSelectedProductIds,
  selectedVariantIdsToAdd,
  setSelectedVariantIdsToAdd,
  selectedProductNameMap,
  setSelectedProductNameMap,
  brandOptions,
  brandLoading,
  selectedBrandIds,
  setSelectedBrandIds,
  selectedBrandNameMap,
  setSelectedBrandNameMap,
  searchProducts,
  searchBrands,
  searchVariants,
  addProductsToVariants,
  addBrandsToVariants,
  removeBrandsFromVariants,
  addVariantsToVariants,
  addAllProductsToVariants,
}) => {
  const { token } = theme.useToken();
  const { isDarkMode } = useThemeStore();
  const productSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const variantSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(
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

  return (
    <Card
      size="small"
      variant="outlined"
      style={{
        marginBottom: 12,
        borderRadius: 8,
        background: isDarkMode ? token.colorBgContainer : "#FFF7FB",
        border: `1px solid ${isDarkMode ? token.colorBorderSecondary : "#f0d7e5"}`,
      }}
      styles={{ body: { padding: 16 } }}
      title={
        <Space>
          <span style={{ fontWeight: 600, fontSize: 14, color: isDarkMode ? token.colorPrimary : "#9B3C6C" }}>
            Tambahkan Produk
          </span>
          <Tooltip title="Pilih mode input untuk menambahkan produk atau menerapkan diskon ke semua produk.">
            <InfoCircleOutlined style={{ color: isDarkMode ? token.colorPrimary : "#9B3C6C", opacity: 0.85 }} />
          </Tooltip>
        </Space>
      }
    >
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={24}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 8,
              color: token.colorText,
            }}
          >
            Mode Input
          </div>
          <Select
            value={inputMode}
            size="large"
            onChange={(v) => {
              setInputMode(v as "product" | "brand" | "all" | "variant");
              setSelectedProductId(null);
              setSelectedProductName("");
              setSelectedProductIds([]);
              setSelectedProductNameMap({});
              setSelectedVariantIdsToAdd([]);
              setSelectedBrandIds([]);
              setSelectedBrandNameMap({});
            }}
            options={[
              { value: "product", label: "Per Product" },
              { value: "brand", label: "Per Brand" },
              { value: "variant", label: "Per Variant" },
              { value: "all", label: "Semua Product" },
            ]}
            style={{ width: "100%", borderRadius: 8 }}
          />
        </Col>

        {inputMode === "all" ? (
          <Col xs={24}>
            <div
              style={{
                border: `1px dashed ${isDarkMode ? token.colorBorder : "#e9c2d3"}`,
                background: isDarkMode ? token.colorFillAlter : "#fff",
                padding: 14,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 13, color: token.colorText }}>
                Mode <b>Semua Product</b> akan menerapkan diskon ke seluruh
                produk saat klik <b>Simpan</b>.
              </Text>
              <div style={{ marginTop: 6 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Produk yang sedang <b>sale/flash sale</b> tidak diikutkan.
                </Text>
              </div>
              <div style={{ marginTop: 12 }}>
                <Button
                  block
                  type="primary"
                  icon={<PlusOutlined />}
                  loading={allProductsLoading}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    border: "none",
                    background: isDarkMode
                      ? `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
                      : "linear-gradient(135deg, #B24A7C 0%, #8F2F5F 100%)",
                    boxShadow: isDarkMode
                      ? "none"
                      : "0 6px 16px rgba(155, 60, 108, 0.28)",
                  }}
                  onClick={() => addAllProductsToVariants()}
                >
                  Muat Produk
                </Button>
              </div>
            </div>
          </Col>
        ) : inputMode === "product" ? (
          <>
            <Col xs={24} md={24}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                Produk (multi)
              </div>
              <Select
                mode="multiple"
                showSearch
                filterOption={false}
                size="large"
                onSearch={(kw) =>
                  runDebouncedSearch(productSearchDebounceRef, () =>
                    searchProducts(kw, null),
                  )
                }
                onFocus={() => {
                  if (productSearchDebounceRef.current) {
                    clearTimeout(productSearchDebounceRef.current);
                  }
                  searchProducts("", null);
                }}
                onOpenChange={(open) => {
                  if (!open) return;
                  if (productSearchDebounceRef.current) {
                    clearTimeout(productSearchDebounceRef.current);
                  }
                  searchProducts("", null);
                }}
                options={productOptions}
                loading={productLoading}
                notFoundContent={productLoading ? loadingDropdown : "Tidak ada data"}
                placeholder="Cari produk..."
                value={selectedProductIds}
                onChange={(vals, options: any) => {
                  const ids = (vals ?? []).map((v: any) => Number(v));
                  setSelectedProductIds(ids);
                  setSelectedProductId(null);
                  setSelectedProductName("");
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
            <Col xs={24} md={24}>
              <Button
                block
                type="primary"
                icon={<PlusOutlined />}
                disabled={!selectedProductIds.length}
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  border: "none",
                  background: isDarkMode
                    ? `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
                    : "linear-gradient(135deg, #B24A7C 0%, #8F2F5F 100%)",
                  boxShadow: isDarkMode ? "none" : "0 6px 16px rgba(155, 60, 108, 0.28)",
                }}
                onClick={() => {
                  if (!selectedProductIds.length) return;
                  addProductsToVariants(
                    selectedProductIds,
                    selectedProductNameMap,
                  );
                  setSelectedProductIds([]);
                  setSelectedProductNameMap({});
                }}
              >
                Tambah Produk
              </Button>
            </Col>
          </>
        ) : inputMode === "brand" ? (
          <>
            <Col xs={24} md={24}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 8,
                  color: token.colorText,
                }}
              >
                Brand
              </div>
              <Select
                mode="multiple"
                showSearch
                filterOption={false}
                size="large"
                onSearch={searchBrands}
                onFocus={() => searchBrands("")}
                onOpenChange={(open) => open && searchBrands("")}
                options={brandOptions}
                loading={brandLoading}
                placeholder="Pilih brand..."
                value={selectedBrandIds}
                allowClear
                maxTagCount="responsive"
                onChange={(vals, options: any) => {
                  const ids = (vals ?? []).map((v: any) => Number(v)).filter((id: number) => id > 0);
                  const removedIds = selectedBrandIds.filter((id) => !ids.includes(id));
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
            <Col xs={24} md={24}>
              <Button
                block
                type="primary"
                icon={<PlusOutlined />}
                disabled={!selectedBrandIds.length}
                loading={productLoading}
                size="large"
                onClick={async () => {
                  if (!selectedBrandIds.length) return;
                  await addBrandsToVariants(selectedBrandIds, selectedBrandNameMap);
                }}
              >
                Tambah Brand
              </Button>
              <div style={{ marginTop: 6 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Bisa pilih beberapa brand. Klik `x` pada tag untuk batal sebelum ditambahkan.
                </Text>
              </div>
            </Col>
          </>
        ) : (
          <>
            <Col xs={24} md={24}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                Varian (multi)
              </div>
              <Select
                mode="multiple"
                showSearch
                filterOption={false}
                size="large"
                onSearch={(kw) =>
                  runDebouncedSearch(variantSearchDebounceRef, () =>
                    searchVariants(kw, null),
                  )
                }
                onFocus={() => {
                  if (variantSearchDebounceRef.current) {
                    clearTimeout(variantSearchDebounceRef.current);
                  }
                  searchVariants("", null);
                }}
                onOpenChange={(open) => {
                  if (!open) return;
                  if (variantSearchDebounceRef.current) {
                    clearTimeout(variantSearchDebounceRef.current);
                  }
                  searchVariants("", null);
                }}
                options={variantOptions}
                loading={variantLoading}
                notFoundContent={variantLoading ? loadingDropdown : "Tidak ada data"}
                placeholder="Cari brand, produk, atau varian..."
                value={selectedVariantIdsToAdd}
                onChange={(vals) =>
                  setSelectedVariantIdsToAdd(
                    (vals ?? []).map((v: any) => Number(v)),
                  )
                }
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} md={24}>
              <Button
                block
                type="primary"
                icon={<PlusOutlined />}
                disabled={!selectedVariantIdsToAdd.length}
                size="large"
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  border: "none",
                  background: isDarkMode
                    ? `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
                    : "linear-gradient(135deg, #B24A7C 0%, #8F2F5F 100%)",
                  boxShadow: isDarkMode
                    ? "none"
                    : "0 6px 16px rgba(155, 60, 108, 0.28)",
                }}
                onClick={() => {
                  if (!selectedVariantIdsToAdd.length) return;
                  addVariantsToVariants(selectedVariantIdsToAdd);
                  setSelectedVariantIdsToAdd([]);
                }}
              >
                Tambah Varian
              </Button>
            </Col>
          </>
        )}
      </Row>

    </Card >
  );
};

export default DiscountProductPickerCard;
