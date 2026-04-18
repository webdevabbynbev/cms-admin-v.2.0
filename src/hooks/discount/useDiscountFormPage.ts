import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { message } from "antd";
import type { FormInstance } from "antd";
import { getDiscountOptionProducts } from "../../api/discount";
import type {
  Props,
  VariantRow,
  ProductGroupRow,
  BrandGroupRow,
} from "./discountFormTypes";
import { toDateOnly, resolveIdentifier } from "./discountFormUtils";
import {
  computeFromPercent,
  computeFromPrice,
  mapApiToForm,
} from "./discountFormPageHelpers";
import {
  createDiscountProductHandlers,
  type ProductOption,
  type ProductMeta,
} from "./discountFormProductHandlers";
import { createDiscountHydrationHandlers } from "./discountFormHydrationHandlers";
import { createDiscountImportHandlers } from "./discountFormImportHandlers";
import { createDiscountEditHandlers } from "./discountFormEditHandlers";
import { createDiscountSubmitHandlers } from "./discountFormSubmitHandlers";

export type {
  Props,
  VariantRow,
  ProductGroupRow,
  BrandGroupRow,
} from "./discountFormTypes";
export { rupiahFormatter, rupiahParser } from "./discountFormUtils";

const normalizeSearchValue = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const matchesByOrderedTokens = (
  haystack: string,
  normalizedQuery: string,
  tokens: string[],
) => {
  if (!normalizedQuery) return true;
  if (!haystack) return false;
  if (haystack.includes(normalizedQuery)) return true;
  if (!tokens.length) return false;

  let cursor = 0;
  for (const token of tokens) {
    const idx = haystack.indexOf(token, cursor);
    if (idx < 0) return false;
    cursor = idx + token.length;
  }
  return true;
};

export default function useDiscountFormPage({
  mode,
  form,
}: Props & { form: FormInstance }) {
  const nav = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const fromState = (location.state as any) || null;

  const [loading, setLoading] = useState(false);

  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [brandProductOptions, setBrandProductOptions] = useState<
    ProductOption[]
  >([]);
  const [productLoading, setProductLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [variantOptions, setVariantOptions] = useState<
    { label: string; value: number; productId?: number }[]
  >([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const productSearchSeqRef = useRef(0);
  const variantSearchSeqRef = useRef(0);
  const productOptionsCacheRef = useRef(
    new Map<
      string,
      {
        value: number;
        label: string;
        brandId?: number | null;
        brandName?: string | null;
        isSale?: boolean;
        isFlashSale?: boolean;
        searchText: string;
        image?: string | null;
      }[]
    >(),
  );
  const variantOptionsCacheRef = useRef(
    new Map<string, { label: string; value: number; productId?: number }[]>(),
  );
  const [selectedVariantIdsToAdd, setSelectedVariantIdsToAdd] = useState<
    number[]
  >([]);

  const [allProductsLoading, setAllProductsLoading] = useState(false);

  const [inputMode, setInputMode] = useState<
    "product" | "brand" | "all" | "variant"
  >("product");
  const [allPercent, setAllPercent] = useState<number | null>(null);
  const [allMaxDiscount, setAllMaxDiscount] = useState<number | null>(null);
  const [brandOptions, setBrandOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [selectedBrandNameMap, setSelectedBrandNameMap] = useState<
    Record<number, string>
  >({});
  const [brandProductIdsMap, setBrandProductIdsMap] = useState<
    Record<number, number[]>
  >({});

  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);
  const variantsRef = useRef<VariantRow[]>([]);

  // simpan code lama (karena code input tidak ditampilkan)
  const [meta, setMeta] = useState<{ code: string } | null>(null);

  const [productNameById, setProductNameById] = useState<
    Record<number, string>
  >({});

  const [productMetaById, setProductMetaById] = useState<
    Record<number, ProductMeta>
  >({});

  // ===== Export/Import Detail (NEW) =====
  const [ioLoading, setIoLoading] = useState(false);
  const [ioScope, setIoScope] = useState<"variant" | "product" | "brand">(
    "variant",
  );
  const [importTransfer, setImportTransfer] = useState(true);
  const uploadRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<
    "all" | "brand" | "product" | "variant"
  >("all");
  const [hydratingVariants, setHydratingVariants] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const nextScope =
      inputMode === "brand"
        ? "brand"
        : inputMode === "variant"
          ? "variant"
          : inputMode === "all"
            ? "all"
            : "product";
    setSearchScope((prev) => (prev === nextScope ? prev : nextScope));
  }, [inputMode]);

  const currentIdentifier = useMemo(() => resolveIdentifier(id), [id]);

  const goToList = () => nav("/discounts");

  const {
    searchProducts,
    searchBrands,
    searchVariants,
    fetchProductsMetaByIds,
    fetchProductVariantsByIds,
    addProductsToVariants,
    addVariantsToVariants,
    addProductToVariants,
    addAllProductsToVariants: addAllProductsToVariantsRaw,
    removeProduct,
  } = createDiscountProductHandlers({
    productMetaById,
    productNameById,
    productSearchSeqRef,
    variantSearchSeqRef,
    productOptionsCacheRef,
    variantOptionsCacheRef,
    getVariants: () => variantsRef.current,
    setProductLoading,
    setProductOptions,
    setBrandProductOptions,
    setProductMetaById,
    setProductNameById,
    setVariants,
    setSelectedVariantIds,
    setLoading,
    setBrandLoading,
    setBrandOptions,
    setVariantLoading,
    setVariantOptions,
  });

  const { hydrateFromVariantItems } = createDiscountHydrationHandlers({
    productMetaById,
    productNameById,
    setProductMetaById,
    setProductNameById,
    setVariants,
    fetchProductsMetaByIds,
    fetchProductVariantsByIds,
  });

  const hydrateWithLoading = async (serve: any) => {
    setHydratingVariants(true);
    try {
      await hydrateFromVariantItems(serve);
    } finally {
      setHydratingVariants(false);
    }
  };

  const { exportItems, downloadTemplate, uploadProps } =
    createDiscountImportHandlers({
      mode,
      currentIdentifier,
      ioScope,
      importTransfer,
      form,
      setIoLoading,
      setMeta,
      hydrateFromVariantItems: hydrateWithLoading,
    });

  const { loadEdit } = createDiscountEditHandlers({
    mode,
    id,
    nav,
    form,
    setLoading,
    setMeta,
    hydrateFromVariantItems: hydrateWithLoading,
  });

  const { onSubmit } = createDiscountSubmitHandlers({
    mode,
    form,
    variants,
    meta,
    id,
    nav,
    setLoading,
  });

  const updateVariant = (variantId: number, patch: Partial<VariantRow>) => {
    setVariants((prev) =>
      prev.map((r) =>
        r.productVariantId === variantId ? { ...r, ...patch } : r,
      ),
    );
  };

  // ===== Bulk =====
  const [bulkPercent, setBulkPercent] = useState<number | null>(null);
  const [bulkMaxDiscount, setBulkMaxDiscount] = useState<number | null>(null);
  const [bulkPromoStock, setBulkPromoStock] = useState<number | null>(null);

  const resolveBulkDefaults = () => {
    const hasAny =
      bulkPercent !== null ||
      bulkMaxDiscount !== null ||
      bulkPromoStock !== null;
    if (!hasAny) return undefined;
    return {
      discountPercent: bulkPercent,
      maxDiscount: bulkMaxDiscount,
      promoStock: bulkPromoStock,
    };
  };

  const addProductsToVariantsWithDefaults = async (
    productIds: number[],
    nameMap?: Record<number, string>,
    metaOverride?: Record<number, ProductMeta>,
  ) =>
    addProductsToVariants(productIds, nameMap, metaOverride, {
      defaults: resolveBulkDefaults(),
    });

  const addProductToVariantsWithDefaults = async (
    productId: number,
    productName: string,
  ) =>
    addProductToVariants(productId, productName, {
      defaults: resolveBulkDefaults(),
    });

  const addBrandsToVariants = async (
    brandIds: number[],
    brandNameMap?: Record<number, string>,
  ) => {
    const normalizedBrandIds = Array.from(
      new Set(brandIds.map((id) => Number(id)).filter((id) => id > 0)),
    );
    if (!normalizedBrandIds.length) {
      message.warning("Pilih minimal 1 brand.");
      return;
    }

    setProductLoading(true);
    try {
      const settled = await Promise.allSettled(
        normalizedBrandIds.map(async (bid) => {
          const resp: any = await getDiscountOptionProducts({
            q: "",
            brand_id: bid,
            load_all: 1,
          });
          const rows = Array.isArray(resp?.data?.serve?.data)
            ? resp.data.serve.data
            : [];
          return { bid, rows };
        }),
      );

      const metaMap: Record<number, ProductMeta> = {};
      const nameMap: Record<number, string> = {};
      const groupedProductIds: Record<number, number[]> = {};
      const missingBrandNames: string[] = [];

      settled.forEach((result, index) => {
        const bid = normalizedBrandIds[index];
        if (result.status !== "fulfilled") {
          const fallbackName = String(brandNameMap?.[bid] ?? `#${bid}`);
          missingBrandNames.push(fallbackName);
          return;
        }
        const rows = Array.isArray(result.value.rows) ? result.value.rows : [];
        const idsForBrand: number[] = [];

        rows.forEach((p: any) => {
          const id = Number(p?.id ?? 0);
          if (!id) return;
          const productName =
            String(p?.name ?? `Produk ${id}`).trim() || `Produk ${id}`;
          const resolvedBrandName = String(
            p?.brandName ??
              p?.brand_name ??
              p?.brand?.name ??
              brandNameMap?.[bid] ??
              "",
          ).trim();

          idsForBrand.push(id);
          nameMap[id] = productName;
          metaMap[id] = {
            productId: id,
            productName,
            brandId: Number(p?.brandId ?? p?.brand_id ?? bid) || bid,
            brandName: resolvedBrandName,
            isSale: Boolean(p?.isSale ?? p?.is_sale),
            isFlashSale: Boolean(p?.isFlashSale ?? p?.is_flash_sale),
            image: p?.image ?? p?.path ?? null,
          };
        });

        groupedProductIds[bid] = Array.from(new Set(idsForBrand));
      });

      if (missingBrandNames.length) {
        message.warning(
          `Gagal memuat sebagian brand: ${missingBrandNames.join(", ")}`,
        );
      }

      const productIds = Object.keys(nameMap).map((id) => Number(id));
      if (!productIds.length) {
        message.warning("Tidak ada produk untuk brand yang dipilih.");
        return;
      }

      setBrandProductIdsMap((prev) => ({ ...prev, ...groupedProductIds }));
      setProductMetaById((prev) => ({ ...prev, ...metaMap }));
      setProductNameById((prev) => ({ ...prev, ...nameMap }));
      await addProductsToVariantsWithDefaults(productIds, nameMap, metaMap);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Gagal memuat produk brand.");
    } finally {
      setProductLoading(false);
    }
  };

  const removeBrandsFromVariants = async (
    brandIds: number[],
    options?: { silent?: boolean },
  ) => {
    const silent = Boolean(options?.silent);
    const normalizedBrandIds = Array.from(
      new Set(brandIds.map((id) => Number(id)).filter((id) => id > 0)),
    );
    if (!normalizedBrandIds.length) {
      if (!silent) {
        message.warning("Pilih minimal 1 brand untuk dibatalkan.");
      }
      return;
    }

    const idSet = new Set(normalizedBrandIds);
    const mappedProductIds = normalizedBrandIds.flatMap(
      (bid) => brandProductIdsMap[bid] ?? [],
    );
    const productIdSet = new Set(
      mappedProductIds.map((id) => Number(id)).filter((id) => id > 0),
    );

    if (productIdSet.size === 0) {
      variants.forEach((row) => {
        const bid = Number(row.brandId ?? 0);
        if (bid > 0 && idSet.has(bid)) {
          productIdSet.add(Number(row.productId));
        }
      });
    }

    if (productIdSet.size === 0) {
      if (!silent) {
        message.info("Tidak ada produk dari brand terpilih di daftar.");
      }
      return;
    }

    setVariants((prev) =>
      prev.filter((row) => !productIdSet.has(Number(row.productId))),
    );
    setSelectedVariantIds([]);
    if (!silent) {
      message.success("Brand terpilih berhasil dibatalkan dari daftar.");
    }
  };

  const applyBulk = (scope: "selected" | "all") => {
    const target =
      scope === "all"
        ? new Set(variants.map((v) => v.productVariantId))
        : new Set(selectedVariantIds);

    setVariants((prev) =>
      prev.map((r) => {
        if (!target.has(r.productVariantId)) return r;

        const next: VariantRow = { ...r };

        if (bulkPercent !== null) {
          const { pct, discounted } = computeFromPercent(
            r.basePrice,
            bulkPercent,
          );
          next.discountPercent = pct;
          next.discountPrice = discounted;
          next.lastEdited = "percent";
        }

        if (bulkMaxDiscount !== null) {
          next.maxDiscount = bulkMaxDiscount > 0 ? bulkMaxDiscount : null;
        }

        if (bulkPromoStock !== null)
          next.promoStock =
            bulkPromoStock > 0 ? Math.round(bulkPromoStock) : null;
        if (bulkPromoStock === null) next.promoStock = null;


        return next;
      }),
    );
  };

  const applyBulkDefaultsToEmpty = (rows: VariantRow[]) => {
    const pctInput = Number(bulkPercent ?? 0);
    if (!Number.isFinite(pctInput) || pctInput <= 0) return rows;

    let changed = false;
    const next = rows.map((r) => {
      if (!r.isActive) return r;
      const hasPercent =
        typeof r.discountPercent === "number" && r.discountPercent > 0;
      const hasPrice =
        typeof r.discountPrice === "number" &&
        r.discountPrice >= 0 &&
        r.discountPrice < r.basePrice;
      if (hasPercent || hasPrice) return r;

      const { pct, discounted } = computeFromPercent(r.basePrice, pctInput);
      const patch: VariantRow = {
        ...r,
        discountPercent: pct,
        discountPrice: discounted,
        lastEdited: "percent",
      };

      if (
        bulkMaxDiscount !== null &&
        bulkMaxDiscount !== undefined &&
        Number(bulkMaxDiscount) > 0 &&
        (r.maxDiscount === null || r.maxDiscount === undefined)
      ) {
        patch.maxDiscount = Number(bulkMaxDiscount);
      }

      if (
        bulkPromoStock !== null &&
        bulkPromoStock !== undefined &&
        Number(bulkPromoStock) > 0 &&
        (r.promoStock === null || r.promoStock === undefined)
      ) {
        patch.promoStock = Math.round(Number(bulkPromoStock));
      }

      changed = true;
      return patch;
    });

    if (changed) setVariants(next);
    return next;
  };

  const deleteSelectedVariants = () => {
    if (!selectedVariantIds.length) return;
    const set = new Set(selectedVariantIds);
    setVariants((prev) => prev.filter((v) => !set.has(v.productVariantId)));
    setSelectedVariantIds([]);
    message.success("Varian terpilih dihapus");
  };

  // ===== grouping =====
  const brandNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const meta of Object.values(productMetaById)) {
      const bid = Number(meta?.brandId ?? 0);
      const name = String(meta?.brandName ?? "").trim();
      if (bid > 0 && name) map.set(bid, name);
    }
    for (const opt of brandOptions) {
      const bid = Number((opt as any)?.value ?? 0);
      const name = String((opt as any)?.label ?? "").trim();
      if (bid > 0 && name) map.set(bid, name);
    }
    return map;
  }, [productMetaById, brandOptions]);

  const resolveBrandName = useCallback((
    brandId?: number | null,
    fallback?: string | null,
  ) => {
    const clean = String(fallback ?? "").trim();
    if (clean) return clean;
    const bid = Number(brandId ?? 0);
    if (bid > 0) {
      const fromMap = brandNameById.get(bid);
      if (fromMap) return fromMap;
      return `Brand #${bid}`;
    }
    return "Brand Tidak Diketahui";
  }, [brandNameById]);

  const filteredVariants = useMemo(() => {
    const q = normalizeSearchValue(debouncedSearchQuery);
    const qTokens = q.split(" ").filter(Boolean);
    if (!q) return variants;
    return variants.filter((v) => {
      const brandName = resolveBrandName(v.brandId, v.brandName);
      const brandIndex = normalizeSearchValue(
        `${brandName} ${String(v.brandId ?? "")}`,
      );
      const productIndex = normalizeSearchValue(
        `${v.productName} ${String(v.productId ?? "")}`,
      );
      const variantIndex = normalizeSearchValue(
        `${v.variantName} ${v.sku ?? ""} ${String(v.productVariantId ?? "")}`,
      );
      const fullPathIndex = normalizeSearchValue(
        [
          brandName,
          v.productName,
          v.variantName,
          v.sku ?? "",
          String(v.brandId ?? ""),
          String(v.productId ?? ""),
          String(v.productVariantId ?? ""),
        ].join(" "),
      );

      const matchBrand = matchesByOrderedTokens(brandIndex, q, qTokens);
      const matchProduct = matchesByOrderedTokens(productIndex, q, qTokens);
      const matchVariant = matchesByOrderedTokens(variantIndex, q, qTokens);
      const matchPath = matchesByOrderedTokens(fullPathIndex, q, qTokens);

      if (searchScope === "brand") return matchBrand || matchPath;
      if (searchScope === "product") return matchProduct || matchPath;
      if (searchScope === "variant") return matchVariant || matchPath;
      return matchPath || matchBrand || matchProduct || matchVariant;
    });
  }, [variants, debouncedSearchQuery, searchScope, resolveBrandName]);

  const productGroups: ProductGroupRow[] = useMemo(() => {
    const map = new Map<number, VariantRow[]>();
    for (const v of filteredVariants) {
      if (!map.has(v.productId)) map.set(v.productId, []);
      map.get(v.productId)!.push(v);
    }

    const groups: ProductGroupRow[] = [];
    for (const [pid, list] of map.entries()) {
      const meta = productMetaById[pid];
      const name =
        list[0]?.productName || productNameById[pid] || `Produk ${pid}`;
      groups.push({
        key: `p-${pid}`,
        productId: pid,
        brandId: meta?.brandId ?? list[0]?.brandId ?? null,
        brandName: resolveBrandName(
          meta?.brandId ?? list[0]?.brandId ?? null,
          meta?.brandName ?? list[0]?.brandName ?? null,
        ),
        productName: name,
        totalVariants: list.length,
        image: meta?.image || list[0]?.image || null,
        variants: list.sort((a, b) => a.productVariantId - b.productVariantId),
      });
    }

    return groups.sort((a, b) => a.productName.localeCompare(b.productName));
  }, [variants, productNameById, productMetaById, brandNameById, debouncedSearchQuery]);

  const brandGroups: BrandGroupRow[] = useMemo(() => {
    const map = new Map<string, ProductGroupRow[]>();
    for (const pg of productGroups) {
      const bid = pg.brandId ?? null;
      const key = `b-${bid ?? "unknown"}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(pg);
    }

    const groups: BrandGroupRow[] = [];
    for (const [key, list] of map.entries()) {
      const sample = list[0];
      const brandName = resolveBrandName(
        sample?.brandId ?? null,
        sample?.brandName ?? null,
      );
      const totalVariants = list.reduce(
        (acc, cur) => acc + (cur.totalVariants || 0),
        0,
      );

      groups.push({
        key,
        brandId: sample?.brandId ?? null,
        brandName,
        totalProducts: list.length,
        totalVariants,
        products: list.sort((a, b) =>
          a.productName.localeCompare(b.productName),
        ),
      });
    }

    return groups.sort((a, b) => a.brandName.localeCompare(b.brandName));
  }, [productGroups, brandNameById]);

  const defaultExpandedRowKeys = useMemo(() => {
    if (variants.length <= 200) return productGroups.map((g) => g.key);
    return productGroups.slice(0, 30).map((g) => g.key);
  }, [productGroups, variants.length]);

  const defaultExpandedBrandKeys = useMemo(() => {
    if (variants.length <= 200) return brandGroups.map((g) => g.key);
    return brandGroups.slice(0, 20).map((g) => g.key);
  }, [brandGroups, variants.length]);

  useEffect(() => {
    variantsRef.current = variants;
  }, [variants]);

  useEffect(() => {
    const today = toDateOnly(new Date().toISOString());

    if (mode === "create") {
      form.setFieldsValue({
        name: "",
        started_at: today,
        expired_at: today,

        // hidden defaults
        is_active: 1,
        is_ecommerce: 1,
        is_pos: 0,
        no_expiry: 0,
        days_of_week: ["0", "1", "2", "3", "4", "5", "6"],
      });

      setVariants([]);
      setMeta(null);
    }


    if (mode === "edit" && fromState) {
      
      setMeta({ code: String(fromState?.code ?? "") });
      form.setFieldsValue(mapApiToForm(fromState));
      hydrateWithLoading(fromState);
      
    } else if (mode === "edit") {
      
      loadEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addAllProductsToVariants = async () => {
    if (allProductsLoading) return;
    setAllProductsLoading(true);
    try {
      return await addAllProductsToVariantsRaw();
    } finally {
      setAllProductsLoading(false);
    }
  };


  const filterOutSaleFlashVariants = async (
    rows: VariantRow[],
  ): Promise<VariantRow[]> => {
    const productIds = Array.from(
      new Set(rows.map((r) => Number(r.productId)).filter((id) => id > 0)),
    );
    if (!productIds.length) return rows;

    const chunkSize = 100;
    const freshMeta: Record<number, ProductMeta> = {};

    for (let i = 0; i < productIds.length; i += chunkSize) {
      const chunk = productIds.slice(i, i + chunkSize);
      const metaChunk = await fetchProductsMetaByIds(chunk);
      Object.assign(freshMeta, metaChunk);
    }

    const blockedProductIds = new Set<number>();
    for (const pid of productIds) {
      const meta = freshMeta[pid] ?? productMetaById[pid];
      if (meta?.isSale || meta?.isFlashSale) {
        blockedProductIds.add(pid);
      }
    }

    if (!blockedProductIds.size) return rows;

    const filtered = rows.filter(
      (r) => !blockedProductIds.has(Number(r.productId)),
    );
    message.warning(
      `${blockedProductIds.size} produk sale/flash sale dikeluarkan dari payload diskon.`,
    );
    return filtered;
  };

  const handleSubmit = async () => {
    // If inputMode is "all", we now allow manual overrides in the table.
    // So we don't need to fetch ALL products again during submit.
    // We just use the 'variants' state which was populated by addAllProductsToVariants.

    if (allProductsLoading) {
      message.info("Sedang memuat produk, coba lagi sebentar.");
      return;
    }

    const startedAt = form.getFieldValue("started_at");
    const expiredAt = form.getFieldValue("expired_at");
    if (startedAt && expiredAt) {
      const startDate = new Date(startedAt);
      const endDate = new Date(expiredAt);
      if (
        Number.isFinite(startDate.getTime()) &&
        Number.isFinite(endDate.getTime()) &&
        startDate > endDate
      ) {
        message.error("Tanggal mulai harus lebih awal atau sama dengan tanggal selesai.");
        return;
      }
    }

    if (inputMode === "all") {
      const pct = Number(allPercent ?? 0);
      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        message.error("Isi diskon persen antara 1 - 100.");
        return;
      }

      const maxDisc = Number(allMaxDiscount ?? 0);
      if (allMaxDiscount !== null && (!Number.isFinite(maxDisc) || maxDisc < 0)) {
        message.error("Isi maksimal diskon dengan angka yang valid (minimal 0).");
        return;
      }

      const workingVariants = variants;
      if (!workingVariants.length) {
        message.error("Silakan klik 'Muat Produk' terlebih dahulu.");
        return;
      }

      // We use the variants from state (which might have been edited/removed by user)
      const eligibleVariants = await filterOutSaleFlashVariants(workingVariants);
      if (!eligibleVariants.length) {
        message.error("Tidak ada varian yang eligible untuk diproses.");
        return;
      }

      // We apply the 'all' settings only to variants that haven't been manually edited?
      // Actually, user expectations might vary. But they asked to be able to "pilih" (select/remove).
      // Let's stick to the variants in state.

      await onSubmit(eligibleVariants, {
        allProducts: true,
        allPercent: pct,
        allMaxDiscount: maxDisc,
      });
      return;
    }

    const withDefaults = applyBulkDefaultsToEmpty(variants);
    await onSubmit(withDefaults);
  };

  return {
    // form + navigation helper
    goToList,

    // state
    loading,
    ioLoading,
    importTransfer,
    ioScope,
    uploadRef,
    currentIdentifier,

    productOptions,
    brandProductOptions,
    productLoading,
    allProductsLoading,
    selectedProductId,
    selectedProductName,
    selectedProductIds,
    variantOptions,
    variantLoading,
    selectedVariantIdsToAdd,

    inputMode,
    allPercent,
    allMaxDiscount,
    brandOptions,
    brandLoading,
    selectedBrandIds,
    selectedBrandNameMap,

    variants,
    filteredVariants,
    setVariants,
    selectedVariantIds,
    searchQuery,
    setSearchQuery,
    searchScope,
    setSearchScope,
    hydratingVariants,

    bulkPercent,
    bulkMaxDiscount,
    bulkPromoStock,

    productGroups,
    brandGroups,
    defaultExpandedRowKeys,
    defaultExpandedBrandKeys,

    // setters (dipakai UI)
    setImportTransfer,
    setIoScope,
    setSelectedProductId,
    setSelectedProductName,
    setSelectedProductIds,
    setSelectedVariantIdsToAdd,
    setAllPercent,
    setAllMaxDiscount,
    setSelectedBrandIds,
    setSelectedBrandNameMap,
    setSelectedVariantIds,
    setBulkPercent,
    setBulkMaxDiscount,
    setBulkPromoStock,

    // actions
    exportItems,
    downloadTemplate,
    uploadProps,
    searchProducts,
    searchBrands,
    searchVariants,
    addProductsToVariants: addProductsToVariantsWithDefaults,
    addBrandsToVariants,
    removeBrandsFromVariants,
    addVariantsToVariants,
    addAllProductsToVariants,
    addProductToVariants: addProductToVariantsWithDefaults,
    removeProduct,

    applyBulk,
    deleteSelectedVariants,

    computeFromPrice,
    computeFromPercent,
    updateVariant,

    onSubmit: handleSubmit,
    setInputMode: (m: "product" | "brand" | "all" | "variant") => {
      setInputMode(m);
      setSelectedBrandIds([]);
      setSelectedBrandNameMap({});
    },
  };
}
export type DiscountFormPageViewModel = ReturnType<typeof useDiscountFormPage>;
